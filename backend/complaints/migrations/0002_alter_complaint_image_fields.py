from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("complaints", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="complaint",
            name="image_url",
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name="complaint",
            name="annotated_image_url",
            field=models.TextField(blank=True, null=True),
        ),
    ]
