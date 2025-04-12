from django.contrib import admin
from django.urls import path, include  # no need to import views here

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # this links to the api app
]
