
from django.contrib.auth import get_user_model
from branches.models import Branch

User = get_user_model()

def seed_users():
    """
    Seed initial users with roles and optional branches.
    Branches are created if missing and assigned safely.
    """
    users = [
        {"username": "admin", "email": "admin@example.com", "password": "admin123", "role": "ADMIN"},
        {"username": "tech1", "email": "tech1@example.com", "password": "tech123", "role": "TECHNICIAN"},
        {"username": "staff1", "email": "staff1@example.com", "password": "staff123", "role": "STAFF", "branch": "Colombo"},
        {"username": "staff2", "email": "staff2@example.com", "password": "staff123", "role": "STAFF", "branch": "Galle"},
    ]

    role_map = {
        "ADMIN": User.Roles.ADMIN,
        "TECHNICIAN": User.Roles.TECHNICIAN,
        "STAFF": User.Roles.STAFF,
    }

    for u in users:
        # Skip if user exists
        if User.objects.filter(username=u["username"]).exists():
            print(f"ℹ️ User {u['username']} already exists, skipping...")
            continue

        branch_instance = None
        branch_name = u.get("branch")

        # Create or get branch object
        if branch_name:
            branch_instance, created = Branch.objects.get_or_create(name=branch_name)
            if created:
                print(f"🏢 Created branch: {branch_instance.name}")

        # Create user without branch first
        user = User.objects.create_user(
            username=u["username"],
            email=u["email"],
            password=u["password"],
            role=role_map[u["role"]],
        )

        # Assign branch after user is fully created
        if branch_instance:
            # Must assign using the actual Branch instance
            user.branch = Branch.objects.get(pk=branch_instance.pk)
            user.save(update_fields=["branch"])

        print(f"✅ Created user: {user.username} ({user.role})")


if __name__ == "__main__":
    seed_users()
