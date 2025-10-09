import pandas as pd
import random
from Carro import Carro
from datetime import timedelta

pd.set_option("display.max_rows", None)

# --- Configuración base ---
fechas = pd.date_range("2025-10-08 06:00:00", "2025-10-08 20:00:00", freq="1T")
df = pd.DataFrame({"fecha_entrada": fechas})

df["salida_1"] = [[] for _ in range(len(df))]
df["salida_0"] = [[] for _ in range(len(df))]
df["num_carros_1"] = 0
df["num_carros_0"] = 0

# --- Nueva pista ---
df["sentido_3"] = -1
df["salida_3"] = [[] for _ in range(len(df))]
df["num_carros_3"] = 0
df["bloqueo_3"] = pd.NaT  # inicializa como vacío

# Funciones de probabilidad (las mantienes igual)
def probabilidad(dia_semana, hora_decimal, sentido):
    # ... tu función existente ...
    if dia_semana < 5:
        if sentido == 1:
            if 19.5 <= hora_decimal or hora_decimal < 6: return 0.5
            elif 6 <= hora_decimal < 9: return 0.9
            elif 9 <= hora_decimal < 11.5: return 0.5
            elif 11.5 <= hora_decimal < 13: return 1.0
            elif 13 <= hora_decimal < 17: return 0.5
            elif 17 <= hora_decimal < 19.5: return 1.0
        else:
            if 19.5 <= hora_decimal or hora_decimal < 6: return 0.5
            elif 6 <= hora_decimal < 9: return 0.85
            elif 9 <= hora_decimal < 11.5: return 0.5
            elif 11.5 <= hora_decimal < 13: return 1.0
            elif 13 <= hora_decimal < 17: return 0.5
            elif 17 <= hora_decimal < 19.5: return 0.5
    else:
        if sentido == 1:
            if 20 <= hora_decimal or hora_decimal < 6: return 0.40
            elif 6 <= hora_decimal < 13: return 0.20
            elif 13 <= hora_decimal < 15: return 1.0
            elif 15 <= hora_decimal < 20: return 0.3
        else:
            if 22 <= hora_decimal or hora_decimal < 7: return 0.10
            elif 7 <= hora_decimal < 9.5: return 0.9
            elif 9.5 <= hora_decimal < 16.5: return 0.15
            elif 16.5 <= hora_decimal < 22: return 0.20
    return 0

# Función para determinar horario pico (opcional, mantiene tu lógica)
def en_horario_pico(fecha, sentido):
    # ... tu función existente ...
    return False

# --- Simulación minuto a minuto ---
salida_1_lista = []
salida_0_lista = []
salida_3_lista = []
sentido_3 = -1
bloqueo_3 = None

for i, row in df.iterrows():
    fecha = row["fecha_entrada"]
    hora_decimal = fecha.hour + fecha.minute/60
    dia_semana = fecha.weekday()

    # 1️⃣ Eliminar carros cuya salida coincide con la fecha
    salida_1_lista = [c for c in salida_1_lista if c.salida >= fecha]
    salida_0_lista = [c for c in salida_0_lista if c.salida >= fecha]
    salida_3_lista = [c for c in salida_3_lista if c.salida >= fecha]

    # 2️⃣ Verificar apertura de pista 3
    if sentido_3 == -1:
        if len(salida_1_lista) >= 100:
            sentido_3 = 1
        elif len(salida_0_lista) >= 100:
            sentido_3 = 0

    # Si pista 3 está bloqueada por tiempo
    if bloqueo_3 is not None and fecha < bloqueo_3:
        sentido_3 = -1
    elif bloqueo_3 is not None and fecha >= bloqueo_3:
        # Cambia sentido automáticamente si se cumple tiempo
        sentido_3 = 1 - sentido_3  # invertir sentido
        bloqueo_3 = None

    # 3️⃣ Agregar nuevos carros
    # Generación normal en salida_1 y salida_0
    if random.random() < probabilidad(dia_semana, hora_decimal, 1):
        if sentido_3 == 1 and random.random()> 0.5:
            salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))
        else:
            salida_1_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))

    if random.random() < probabilidad(dia_semana, hora_decimal, 0):
        if sentido_3 == 0 and random.random() >0.5:
            salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
        else:
            salida_0_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))

    # 4️⃣ Si la otra salida se llena mientras pista 3 está abierta, iniciar bloqueo de 120 min
    if sentido_3 != -1:
        if (sentido_3 == 1 and len(salida_0_lista) >= 100) or (sentido_3 == 0 and len(salida_1_lista) >= 100):
            bloqueo_3 = fecha + timedelta(minutes=120)
            sentido_3 = -1  # cerrar pista 3 temporalmente

    # 5️⃣ Guardar datos en DataFrame
    df.at[i, "salida_1"] = salida_1_lista.copy()
    df.at[i, "salida_0"] = salida_0_lista.copy()
    df.at[i, "num_carros_1"] = len(salida_1_lista)
    df.at[i, "num_carros_0"] = len(salida_0_lista)

    df.at[i, "salida_3"] = salida_3_lista.copy()
    df.at[i, "num_carros_3"] = len(salida_3_lista)
    df.at[i, "sentido_3"] = sentido_3
    df.at[i, "bloqueo_3"] = bloqueo_3

print(df[["fecha_entrada", "num_carros_1", "num_carros_3"]])