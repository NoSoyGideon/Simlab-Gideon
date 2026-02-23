# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .core import SimulacionCarros  # tu clase de simulación
from rest_framework.permissions import AllowAny


class SimulacionCarrosAPIViewOptim(APIView):
    """
    API optimizada para flujo de carros: envía solo contadores y próxima salida
    """
    permission_classes = [AllowAny] 
    def get(self, request, format=None):
        fecha_inicio = request.GET.get("inicio", "2025-10-08 06:00:00")
        fecha_fin = request.GET.get("fin", "2025-10-08 20:00:00")

        try:
            sim = SimulacionCarros(fecha_inicio, fecha_fin)
            sim.run()
            df_copy = sim.df.copy()

            def resumen_lista(lst):
                if not lst:
                    return {"num_carros": 0, "proxima_salida": None}
                # Tomamos la mínima fecha de salida
                proxima = min([c.salida for c in lst])
                return {"num_carros": len(lst), "proxima_salida": proxima.strftime("%Y-%m-%d %H:%M:%S")}

            # Aplicar resumen a cada lista
            df_copy["salida_1"] = df_copy["salida_1"].apply(resumen_lista)
            df_copy["salida_0"] = df_copy["salida_0"].apply(resumen_lista)
            df_copy["salida_3"] = df_copy["salida_3"].apply(resumen_lista)

            # Convertimos DataFrame a lista de dicts para JSON
            data_json = df_copy.to_dict(orient="records")

            return Response(data_json, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)