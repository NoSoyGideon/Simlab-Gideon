import pandas as pd
import random
from .Carro import Carro
from datetime import timedelta
import matplotlib.pyplot as plt
class SimulacionCarros:
    def __init__(self, fecha_inicio, fecha_fin, freq="1T"):
        self.fecha_inicio = pd.to_datetime(fecha_inicio)
        self.fecha_fin = pd.to_datetime(fecha_fin)
        self.freq = freq  # frecuencia de simulación, default = 1 minuto
        self.df = None
        pd.set_option("display.max_rows", None)
    def run(self):
        # Horarios pico en formato decimal de hora
        # Lunes a viernes
        horas_pico_NS_lv = [(6, 9), (11.5, 13), (17, 19.5)]       # Norte-Sur
        horas_pico_SN_lv = [(6, 9), (11.5, 13), (17, 21.25)]      # Sur-Norte

        # Sábado y domingo
        horas_pico_NS_sd = [(6, 20), (13, 15)]                    # Norte-Sur
        horas_pico_SN_sd = [(7, 9.5), (4.5, 22)]                  # Sur-Norte

        # --- Configuración ---
        # Rango de fechas: un día completo (por ejemplo)
        fechas = pd.date_range(self.fecha_inicio, self.fecha_fin, freq=self.freq)
        df = pd.DataFrame({"fecha_entrada": fechas})
        # Inicializamos las listas y contadores
        df["salida_1"] = [[] for _ in range(len(df))]
        df["salida_0"] = [[] for _ in range(len(df))]
        df["num_carros_1"] = 0
        df["num_carros_0"] = 0

        df["sentido_3"] = -1
        df["salida_3"] = [[] for _ in range(len(df))]
        df["num_carros_3"] = 0
        df["bloqueo_3"] = pd.NaT  # inicializa como vacío

        def en_horario_pico(fecha, sentido):
            dia_semana = fecha.weekday()
            hora_decimal = fecha.hour + fecha.minute / 60

            if dia_semana < 5:  # Lunes a viernes
                if sentido == 1:
                    rangos = horas_pico_NS_lv
                else:
                    rangos = horas_pico_SN_lv
            else:  # Sábado y domingo
                if sentido == 1:
                    rangos = horas_pico_NS_sd
                else:
                    rangos = horas_pico_SN_sd

            # Verificar si la hora está en alguno de los rangos
            for inicio, fin in rangos:
                if inicio <= hora_decimal <= fin:
                    return True
            return False

        # --- Función de probabilidad ---
        def probabilidad(dia_semana, hora_decimal, sentido):
            if dia_semana < 5:  # Lunes a viernes
                if sentido == 1:
                    if 19.5 <= hora_decimal or hora_decimal < 6: return 0.5
                    elif 6 <= hora_decimal < 9: return 0.85
                    elif 9 <= hora_decimal < 11.5: return 0.6
                    elif 11.5 <= hora_decimal < 13: return 1.0
                    elif 13 <= hora_decimal < 17: return 0.6
                    elif 17 <= hora_decimal < 19.5: return 0.9
                else:
                    if 19.5 <= hora_decimal or hora_decimal < 6: return 0.5
                    elif 6 <= hora_decimal < 9: return 0.80
                    elif 9 <= hora_decimal < 11.5: return 0.6
                    elif 11.5 <= hora_decimal < 13: return 1.0
                    elif 13 <= hora_decimal < 17: return 0.6
                    elif 17 <= hora_decimal < 19.5: return 0.7
            else:  # Fin de semana
                if sentido == 1:
                    if 20 <= hora_decimal or hora_decimal < 6: return 0.70
                    elif 6 <= hora_decimal < 13: return 0.40
                    elif 13 <= hora_decimal < 15: return 1.0
                    elif 15 <= hora_decimal < 20: return 0.4
                else:
                    if 22 <= hora_decimal or hora_decimal < 7: return 0.20
                    elif 7 <= hora_decimal < 9.5: return 0.8
                    elif 9.5 <= hora_decimal < 16.5: return 0.35
                    elif 16.5 <= hora_decimal < 22: return 0.40
            return 0

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
            size_ns = len(salida_1_lista)
            size_sn = len(salida_0_lista)
            # 1️⃣ Eliminar carros cuya salida coincide con la fecha actual
            salida_1_lista = [c for c in salida_1_lista if c.salida >= fecha]
            salida_0_lista = [c for c in salida_0_lista if c.salida >= fecha]
            salida_3_lista = [c for c in salida_3_lista if c.salida >= fecha]



            if sentido_3 == -1:
                if len(salida_1_lista) >= 80:
                    sentido_3 = 1
                elif len(salida_0_lista) >= 80:
                    sentido_3 = 0


            # Si pista 3 está bloqueada por tiempo
            if bloqueo_3 is not None and len(salida_3_lista) == 0:
                sentido_3 = -1
                bloqueo_3 = None
            elif  bloqueo_3 is not None and fecha < bloqueo_3:
                sentido_3 = -1
        
            elif bloqueo_3 is not None and fecha >= bloqueo_3:
                # Cambia sentido automáticamente si se cumple tiempo
                if(size_ns>size_sn):

                    sentido_3 = 1  # invertir sentido
                    bloqueo_3 = None
                else:
                    sentido_3 = 0
                    bloqueo_3 = None

            

      

            # 2️⃣ Agregar nuevos carros según la probabilidad
            if random.random() < probabilidad(dia_semana, hora_decimal, 1):
                if sentido_3 == 1 and random.random()> 0.35:
                    salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))
                    salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))
 
                else:
                    salida_1_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))
                    salida_1_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))



                
            if random.random() < probabilidad(dia_semana, hora_decimal, 0):
                if sentido_3 == 0 and random.random() >0.35:
                    salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
                    salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
    
                else:


                    salida_0_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
                    salida_0_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
       


            if en_horario_pico(fecha, 1) and len(salida_1_lista) < size_ns:
                if sentido_3 == 1 and random.random()> 0.35:
                    salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))
                    salida_3_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))           
                else:
                    salida_1_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))
                    salida_1_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 1))




            if en_horario_pico(fecha, 0) and len(salida_0_lista) < size_sn:

                salida_0_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
                salida_0_lista.append(Carro(fecha.strftime("%Y-%m-%d %H:%M:%S"), 0))
            if sentido_3 != -1:
                if (sentido_3 == 1 and len(salida_0_lista) >= 80 and len(salida_1_lista)<60) or (sentido_3 == 0 and len(salida_1_lista) >= 80 and len(salida_0_lista)<60):
                    bloqueo_3 = fecha + timedelta(minutes=120)
                    sentido_3 = -1  # cerrar pista 3 temporalmente






            # 3️⃣ Guardar listas y contadores
            df.at[i, "salida_1"] = salida_1_lista.copy()
            df.at[i, "salida_0"] = salida_0_lista.copy()
            df.at[i, "num_carros_1"] = len(salida_1_lista)
            df.at[i, "num_carros_0"] = len(salida_0_lista)

            df.at[i, "salida_3"] = salida_3_lista.copy()
            df.at[i, "num_carros_3"] = len(salida_3_lista)
            df.at[i, "sentido_3"] = sentido_3
            df.at[i, "bloqueo_3"] = bloqueo_3

        # --- Mostrar resumen de densidad ---
        print(df[["fecha_entrada", "num_carros_1", "num_carros_0","num_carros_3","sentido_3"]])
        self.df = df
        return df
    
    def to_json(self):
        if self.df is None:
            raise ValueError("Simulación no ejecutada todavía")
        # Convertir listas de Carro a número de elementos y fecha de salida si quieres más detalle
        df_copy = self.df.copy()
        for col in ["salida_1", "salida_0", "salida_3"]:
            df_copy[col] = df_copy[col].apply(lambda lst: [c.salida.strftime("%Y-%m-%d %H:%M:%S") for c in lst])
        # Convertimos todo a JSON
        return df_copy.to_json(orient="records", date_format="iso")

