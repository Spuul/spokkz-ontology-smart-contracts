
from boa.interop.System.Storage import Put, Delete


def Revert():
    """
    Revert the transaction. The opcodes of this function is `09f7f6f5f4f3f2f1f000f0`,
    but it will be changed to `ffffffffffffffffffffff` since opcode THROW doesn't
    work, so, revert by calling unused opcode.
    """
    raise Exception(0xF0F1F2F3F4F5F6F7)


def SafePut(context, key, value):
    if value == 0:
        Delete(context, key)
    else:
        Put(context, key, value)
