from rest_framework import serializers
from .models import JournalEntry

class JournalEntrySerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)  # Display username instead of ID

    class Meta:
        model = JournalEntry
        fields = ['id', 'user', 'title', 'content', 'severity', 'timestamp']
        read_only_fields = ['user', 'timestamp']

    def validate_severity(self, value):
        if value and value not in ['mild', 'moderate', 'severe']:
            raise serializers.ValidationError("Severity must be 'mild', 'moderate', or 'severe'.")
        return value