// === Aero Sense - ESP32 com Buffer e Frequência Adaptativa ===
// Envia em tempo real para /api/sensor e, se falhar, armazena e ajusta frequência

#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <HTTPClient.h>
#include "time.h"
#include <math.h>

// ------------ Pinos e sensores ------------
#define MQ135_PIN 34
Adafruit_BME280 bme;

// ------------ Calibração MQ-135 (heurística) ------------
#define R_LOAD         10000.0
#define ADC_MAX        4095.0
#define R0_CLEAN_AIR   76000.0
#define POWER_LAW_A    110.47
#define POWER_LAW_B    -2.862

// ------------ Wi-Fi ------------
const char* ssid     = "Wifi Ricardo-EXT";
const char* password = "viniped1115";

// ------------ Servidor ------------
const char* SERVER_IP   = "172.203.135.173";
const int   SERVER_PORT = 80;
const char* ENDPOINT        = "/api/sensor";
const char* BATCH_ENDPOINT  = "/api/sensor/batch";

// ------------ NTP / Hora local (America/Sao_Paulo) ------------
const char* ntpServer          = "pool.ntp.org";
const long  gmtOffset_sec      = -3 * 3600;
const int   daylightOffset_sec = 0;

// ------------ Amostragem e buffer com FREQUÊNCIA ADAPTATIVA ------------
const unsigned long SEND_INTERVAL_ONLINE_MS  = 5000;    // 5s quando online
const unsigned long SEND_INTERVAL_OFFLINE_MS = 600000;  // 10 min quando offline
const int MAX_BUFFER = 500;                             // 500 leituras
const int MAX_CONSECUTIVE_FAILURES = 3;                 // Após 3 falhas, muda para modo offline

unsigned long currentSendInterval = SEND_INTERVAL_ONLINE_MS;
int consecutiveFailures = 0;
bool offlineMode = false;

struct Reading {
  float temperature, humidity, co2, vocs, nox;
  int aqi;
  time_t ts; // timestamp coletado (NTP)
};

Reading bufferReadings[MAX_BUFFER];
int bufCount = 0;

// ------------ Estado atual (medidas) ------------
float temperatura_atual = 0;
float umidade_atual     = 0;
int   leitura_mq_bruta  = 0;
int   aqi_estimado      = 0;
float co2_ppm_estimado  = 0.0;
float vocs_ppb_estimado = 0.0;
float nox_ppm_estimado  = 0.0;

// ------------ Utilitários ------------
String iso8601(time_t t) {
  struct tm ti;
  localtime_r(&t, &ti);
  char out[25];
  strftime(out, sizeof(out), "%Y-%m-%dT%H:%M:%SZ", &ti);
  return String(out);
}

void addToBuffer(const Reading& r) {
  if (bufCount < MAX_BUFFER) {
    bufferReadings[bufCount++] = r;
  } else {
    // Descarte do mais antigo para manter os mais recentes
    for (int i = 1; i < MAX_BUFFER; i++) bufferReadings[i - 1] = bufferReadings[i];
    bufferReadings[MAX_BUFFER - 1] = r;
    Serial.println("⚠️ Buffer cheio! Descartando leitura mais antiga.");
  }
}

bool postJson(const String& url, const String& payload) {
  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);
  int code = http.POST(payload);
  if (code <= 0) {
    Serial.printf("[HTTP] POST falhou: %s\n", http.errorToString(code).c_str());
  } else {
    Serial.printf("[HTTP] POST status: %d\n", code);
  }
  http.end();
  return (code > 0 && code < 400);
}

void ensureWifi(unsigned long timeoutMs = 10000) {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Reconectando Wi-Fi");
  WiFi.begin(ssid, password);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < timeoutMs) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi ok. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Wi-Fi ainda desconectado.");
  }
}

int calculateAQI(float co2, float vocs, float nox) {
  
  int aqi_co2 = 0;
  int aqi_vocs = 0;
  int aqi_nox = 0;
  
  if (co2 <= 600) {
    aqi_co2 = map(co2, 400, 600, 0, 50);
  } else if (co2 <= 1000) {
    aqi_co2 = map(co2, 600, 1000, 51, 100);
  } else if (co2 <= 2000) {
    aqi_co2 = map(co2, 1000, 2000, 101, 150);
  } else {
    aqi_co2 = map(co2, 2000, 5000, 151, 300);
  }
  
  // Sub-índice VOCs (baseado em ppb)
  // Boa: 0-50 (0-220 ppb) | Moderada: 51-100 (220-660) | Insalubre: 101-150 (660-2200) | Ruim: 151+ (2200+)
  if (vocs <= 220) {
    aqi_vocs = map(vocs, 0, 220, 0, 50);
  } else if (vocs <= 660) {
    aqi_vocs = map(vocs, 220, 660, 51, 100);
  } else if (vocs <= 2200) {
    aqi_vocs = map(vocs, 660, 2200, 101, 150);
  } else {
    aqi_vocs = map(vocs, 2200, 5000, 151, 300);
  }
  
  // Sub-índice NOx (baseado em ppm)
  // Boa: 0-50 (0-0.05 ppm) | Moderada: 51-100 (0.05-0.1) | Insalubre: 101-150 (0.1-0.2) | Ruim: 151+ (0.2+)
  float nox_scaled = nox * 1000; // Converte para escala 0-1000
  if (nox <= 0.05) {
    aqi_nox = map(nox_scaled, 0, 50, 0, 50);
  } else if (nox <= 0.1) {
    aqi_nox = map(nox_scaled, 50, 100, 51, 100);
  } else if (nox <= 0.2) {
    aqi_nox = map(nox_scaled, 100, 200, 101, 150);
  } else {
    aqi_nox = map(nox_scaled, 200, 500, 151, 300);
  }
  
  // Retorna o MAIOR sub-índice (pior poluente define o AQI)
  int aqi_final = max(aqi_co2, max(aqi_vocs, aqi_nox));
  
  // Limita entre 0 e 500
  return constrain(aqi_final, 0, 500);
}

// ------------ Cálculo MQ-135 (estimativa) ------------
void calcularEstimativas(int leitura) {
  float Rs = R_LOAD * ((ADC_MAX / (float)leitura) - 1.0);
  float Ratio = Rs / R0_CLEAN_AIR;

  float logRatio = log10(Ratio);
  float logConcentration = (logRatio - log10(POWER_LAW_A)) / POWER_LAW_B;
  float gas_concentracao_ppm = pow(10, logConcentration);

  // Ajuste de escala: CO₂ real está ~100x menor que o esperado
  co2_ppm_estimado  = gas_concentracao_ppm * 100.0;  // Corrigido: multiplica por 100
  vocs_ppb_estimado = gas_concentracao_ppm * 1000.0;
  nox_ppm_estimado  = gas_concentracao_ppm / 100.0;

  // Calcula AQI baseado em todos os poluentes
  aqi_estimado = calculateAQI(co2_ppm_estimado, vocs_ppb_estimado, nox_ppm_estimado);
}

// ------------ Envio imediato ------------
bool sendDataToServerNow(const Reading& r) {
  if (WiFi.status() != WL_CONNECTED) return false;

  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + String(ENDPOINT);

  String jsonPayload = "{";
  jsonPayload += "\"temperature\":" + String(r.temperature, 2) + ",";
  jsonPayload += "\"humidity\":"    + String(r.humidity, 1)    + ",";
  jsonPayload += "\"aqi\":"         + String(r.aqi)            + ",";
  jsonPayload += "\"co2\":"         + String(r.co2, 2)         + ",";
  jsonPayload += "\"vocs\":"        + String(r.vocs, 2)        + ",";
  jsonPayload += "\"nox\":"         + String(r.nox, 3);
  jsonPayload += "}";

  Serial.print("POST (single) -> ");
  Serial.println(url);
  return postJson(url, jsonPayload);
}

// ------------ Envio do buffer em lote ------------
void flushBufferIfAny() {
  if (WiFi.status() != WL_CONNECTED || bufCount == 0) return;

  String url = "http://" + String(SERVER_IP) + ":" + String(SERVER_PORT) + String(BATCH_ENDPOINT);

  // Monta {"readings":[{...},{...}]}
  String payload = "{\"readings\":[";
  for (int i = 0; i < bufCount; i++) {
    if (i) payload += ",";
    payload += "{";
    payload += "\"temperature\":" + String(bufferReadings[i].temperature, 2) + ",";
    payload += "\"humidity\":"    + String(bufferReadings[i].humidity, 1)    + ",";
    payload += "\"aqi\":"         + String(bufferReadings[i].aqi)            + ",";
    payload += "\"co2\":"         + String(bufferReadings[i].co2, 2)         + ",";
    payload += "\"vocs\":"        + String(bufferReadings[i].vocs, 2)        + ",";
    payload += "\"nox\":"         + String(bufferReadings[i].nox, 3)         + ",";
    payload += "\"createdAt\":\"" + iso8601(bufferReadings[i].ts) + "\"";
    payload += "}";
  }
  payload += "]}";

  Serial.print("POST (batch) -> ");
  Serial.println(url);

  if (postJson(url, payload)) {
    Serial.printf("✅ Batch enviado com sucesso (%d leituras)\n", bufCount);
    bufCount = 0; // limpa buffer
    // Sucesso: volta para modo online
    consecutiveFailures = 0;
    if (offlineMode) {
      offlineMode = false;
      currentSendInterval = SEND_INTERVAL_ONLINE_MS;
      Serial.println("🟢 Modo ONLINE ativado (intervalo: 5s)");
    }
  } else {
    Serial.println("❌ Falha ao enviar batch. Mantendo no buffer.");
    consecutiveFailures++;
  }
}

// ------------ Debug de horário ------------
void printLocalTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Falha ao obter hora");
    return;
  }
  Serial.printf("Data/Hora: %02d/%02d/%04d %02d:%02d:%02d\n",
                timeinfo.tm_mday, timeinfo.tm_mon + 1, timeinfo.tm_year + 1900,
                timeinfo.tm_hour, timeinfo.tm_min, timeinfo.tm_sec);
}

// ------------ Setup ------------
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("Inicializando...");

  WiFi.begin(ssid, password);
  ensureWifi();

  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Sincronizando NTP...");

  if (!bme.begin(0x76)) {
    Serial.println("Erro ao iniciar BME280 (0x76). Verifique o I2C.");
    while (1) delay(1000);
  }
  Serial.println("Sensores prontos.");
  Serial.printf("Modo: ONLINE (intervalo: %lums)\n", currentSendInterval);
}

// ------------ Loop principal ------------
void loop() {
  ensureWifi();            // reconecta se cair
  flushBufferIfAny();      // tenta enviar o que estiver no buffer

  // Coleta
  temperatura_atual = bme.readTemperature();
  umidade_atual     = bme.readHumidity();
  leitura_mq_bruta  = analogRead(MQ135_PIN);

  calcularEstimativas(leitura_mq_bruta);
  printLocalTime();

  // Monta leitura atual
  Reading r;
  r.temperature = temperatura_atual;
  r.humidity    = umidade_atual;
  r.co2         = co2_ppm_estimado;
  r.vocs        = vocs_ppb_estimado;
  r.nox         = nox_ppm_estimado;
  r.aqi         = aqi_estimado;
  r.ts          = time(nullptr);

  // Log rápido
  Serial.println("\n--- Leitura ---");
  Serial.printf("Temp: %.2f C | Umid: %.1f %% | MQ135: %d\n", temperatura_atual, umidade_atual, leitura_mq_bruta);
  Serial.printf("AQI:%d | CO2:%.2f ppm | VOCs:%.2f ppb | NOx:%.3f ppm\n", aqi_estimado, co2_ppm_estimado, vocs_ppb_estimado, nox_ppm_estimado);
  Serial.printf("Buffer: %d/%d | Modo: %s | Intervalo: %lum\n", 
                bufCount, MAX_BUFFER, 
                offlineMode ? "OFFLINE 🔴" : "ONLINE 🟢",
                currentSendInterval / 60000);

  // Envio single; se falhar, guarda no buffer
  if (!sendDataToServerNow(r)) {
    addToBuffer(r);
    Serial.printf("Leitura armazenada no buffer (%d/%d)\n", bufCount, MAX_BUFFER);
    consecutiveFailures++;
    
    // Se falhou múltiplas vezes, muda para modo offline
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && !offlineMode) {
      offlineMode = true;
      currentSendInterval = SEND_INTERVAL_OFFLINE_MS;
      Serial.println("🔴 Modo OFFLINE ativado! Reduzindo frequência para 10min para economizar buffer.");
    }
  } else {
    // Sucesso: reseta contador
    consecutiveFailures = 0;
    if (offlineMode) {
      offlineMode = false;
      currentSendInterval = SEND_INTERVAL_ONLINE_MS;
      Serial.println("🟢 Modo ONLINE ativado (intervalo: 5s)");
    }
  }

  // Tenta mais uma descarga do buffer (caso single tenha aberto o caminho)
  flushBufferIfAny();

  delay(currentSendInterval);
}
