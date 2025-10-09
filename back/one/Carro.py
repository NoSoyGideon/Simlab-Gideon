import random
from datetime import datetime, timedelta

class Carro:
    # Festivos de ejemplo (puedes ampliar)
    FESTIVOS = [
        "2025-01-01", "2025-12-24", "2025-12-31",  # nacionales y fechas especiales
        # agregar regionales si quieres: "2025-10-12", etc.
    ]
    
    def __init__(self, fecha_hora_entrada: str, sentido: int):
        self.entrada = datetime.strptime(fecha_hora_entrada, "%Y-%m-%d %H:%M:%S")
        self.sentido = sentido  # 1 = norte-sur, 0 = sur-norte
        self.tiempo_total = self.calcular_tiempo_total()
        self.salida = self.entrada + timedelta(seconds=self.tiempo_total)


    def es_festivo(self):
        fecha_str = self.entrada.strftime("%Y-%m-%d")
        # también considerar 24 y 31 de diciembre aunque no estén en la lista
        dia = self.entrada.day
        mes = self.entrada.month
        if fecha_str in self.FESTIVOS or (mes == 12 and dia in [24, 31]):
            return True
        return False

    def es_fin_de_semana(self):
        # weekday() → 0=Lunes ... 6=Domingo
        return self.entrada.weekday() >= 5

    def calcular_tiempo_total(self):
        # Paso 1: elegir aleatoriamente el tiempo base
        tiempo_base_min = random.choice([12, 16, 20])

        tiempo_base_seg = tiempo_base_min * 60

        # Paso 2: sumar según sentido
        if self.sentido == 1:
            ajuste_sentido = 90  # 30s a 90s
        else:
            ajuste_sentido = 60  # 0s a 30s

        # Paso 3: ajuste según día de semana/fin de semana
        if self.es_fin_de_semana():
            if self.sentido == 1:
                ajuste_dia = 8*60  # ~8 min ±2 → 6 a 10 min
            else:
                ajuste_dia = 0*60
        else:  # lunes a viernes
            if self.sentido == 1:
                ajuste_dia = 18*60 # 18 ±2
            else:
                ajuste_dia = 6*60   # 6 ±2
        ajuste_festivo = 0
        # Paso 4: festivo
        if self.es_festivo():

            ajuste_festivo = 10*60 
            ajuste_dia = 0

        total_segundos = tiempo_base_seg + ajuste_sentido + ajuste_dia + ajuste_festivo
        return total_segundos

    def __str__(self):
        return f"Entrada: {self.entrada}, Sentido: {self.sentido}, Salida: {self.salida}"

# --- Ejemplo de uso ---
c1 = Carro("2025-10-10 14:30:00", 1)
c2 = Carro("2025-12-25 09:15:00", 0)

print(c1)
print(c2)
