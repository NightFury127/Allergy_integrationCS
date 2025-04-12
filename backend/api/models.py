from django.db import models
from django.contrib.auth.models import User

class JournalEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='journal_entries')  # Added user association
    title = models.CharField(max_length=200)
    content = models.TextField()
    severity = models.CharField(
        max_length=20,
        choices=[('mild', 'Mild'), ('moderate', 'Moderate'), ('severe', 'Severe')],
        blank=True,
        null=True
    )  # Added for allergy context
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

    class Meta:
        ordering = ['-timestamp']  # Default ordering by newest first