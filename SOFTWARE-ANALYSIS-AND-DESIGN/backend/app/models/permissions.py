PERMISSIONS = {
    "admin": {
        "add_member": True,
        "remove_member": True,
        "edit_member_role": True,
        "delete_workspace": True,
        "send_message": True,
        "delete_message": True,
        "view_messages": True,
        "edit_permissions": True
    },
    "member": {
        "add_member": False,
        "remove_member": False,
        "edit_member_role": False,
        "delete_workspace": False,
        "send_message": True,
        "delete_message": False,
        "view_messages": True,
        "edit_permissions": False
    }
}


def has_permission(user_role: str, action: str) -> bool:
    """Check if user role has permission for action"""
    return PERMISSIONS.get(user_role, {}).get(action, False)
