# urls.py
from django.urls import path
from one.views import SimulacionCarrosAPIViewOptim

urlpatterns = [
    path('api/simulacion_carros/', SimulacionCarrosAPIViewOptim.as_view(), name='simular_trafico'),

  
]
