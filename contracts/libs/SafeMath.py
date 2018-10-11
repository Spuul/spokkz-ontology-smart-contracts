
"""
 SafeMath produces elementary operations such as plus, minus but
 check whether it is safe and revert the transaction if it is not safe.
"""

from libs.SafeCheck import Require


def uSub(a, b):
    """
    Operates a minus b with condition that a - b can never be below 0.
    :param a: operand a
    :param b: operand b
    :return: a - b if a - b > 0 or revert the transaction.
    """
    Require(a >= b)
    return a - b
