

from django.shortcuts import render

def frontend(request):
    """
    Serves React's index.html for all frontend routes.
    """
    return render(request, "index.html")
