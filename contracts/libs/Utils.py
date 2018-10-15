from boa.interop.System.Storage import Put, Delete


def Revert():
    """
    Revert the transaction by raising an exception.
    """
    raise Exception(0x00)
    return False


def SafePut(context, key, value):
    if value == 0:
        Delete(context, key)
    else:
        Put(context, key, value)
    return True
