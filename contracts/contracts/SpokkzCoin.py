from boa.interop.System.Runtime import *
from boa.interop.System.Storage import *
from boa.builtins import *

from libs.SafeMath import *
from libs.SafeCheck import *
from libs.Utils import *

TOKEN_NAME = 'Spokkz Token'
TOKEN_SYMBOL = 'SPKZ'

################################################################################
# TOKEN INFO CONSTANTS

DEPLOYER = bytearray(
    b'\x15\xd7\x1d\x26\xc7\x22\x84\xc2\xf6\x46'
    b'\xff\x4f\xde\xfd\xae\xdc\x65\xdc\xfe\x8d'
)
INIT_SUPPLY = 1000000000
TOKEN_DECIMALS = 8
FACTOR = 100000000

################################################################################
# STORAGE KEY CONSTANT
# Belows are storage key for some variable token information.

OWNER_KEY = '___OWNER'
SPKZ_SUPPLY_KEY = '__SUPPLY'


################################################################################
# STORAGE KEY PREFIX
# Since all data are stored in the key-value storage, the data need to be
# classified by key prefix. All key prefixes length must be the same.

OWN_PREFIX = '_____own'
ALLOWANCE_PREFIX = '___allow'


################################################################################
#

def Main(operation, args):
    if operation == 'Deploy':
        return Deploy()
    elif operation == 'Name':
        return TOKEN_NAME
    elif operation == 'Decimals':
        return TOKEN_DECIMALS
    elif operation == 'Symbol':
        return TOKEN_SYMBOL
    elif operation == 'TotalSupply':
        return TotalSupply()
    elif operation == 'BalanceOf':
        if len(args) == 1:
            return BalanceOf(args[0])
    elif operation == 'Transfer':
        if len(args) == 3:
            return Transfer(args[0], args[1], args[2])
    elif operation == 'TransferFrom':
        if len(args) == 4:
            return TransferFrom(args[0], args[1], args[2], args[3])
    elif operation == 'Approve':
        if len(args) == 3:
            return Approve(args[0], args[1], args[2])
    elif operation == 'Allowance':
        if len(args) == 2:
            return Allowance(args[0], args[1])
    elif operation == 'Mint':
        if len(args) == 2:
            return Mint(args[0], args[1])
    elif operation == 'Burn':
        if len(args) == 1:
            return Burn(args[0])
    elif operation == 'TransferOwnership':
        if len(args) == 1:
            return TransferOwnership(args[0])

    return False


def Deploy():
    """
    Constructor of this contract. Only deployer hard-coded can call this function
    and cannot call this function after called once.
    Followings are initialization list for this token
    1. Transfer the owner to the deployer. (Owner can mint and burn the token)
    2. Supply initial coin to the deployer.
    """

    ctx = GetContext()

    # Require(CheckWitness(DEPLOYER))         # only can be initialized by deployer
    # Require(not Get(ctx, 'DEPLOYED'))       # only can deploy once

    # disable to deploy again
    Put(ctx, 'DEPLOYED', 1)

    # the first owner is the deployer
    # can transfer ownership to other by calling `TransferOwner` function
    Put(ctx, OWNER_KEY, DEPLOYER)

    # supply the coin. All coin will be belong to deployer.
    Put(ctx, SPKZ_SUPPLY_KEY, INIT_SUPPLY * FACTOR)
    Put(ctx, concat(OWN_PREFIX, DEPLOYER), INIT_SUPPLY * FACTOR)

    return True


def TotalSupply():
    """
    Gets the total supply for SPKZ token. The total supply can be changed by
    owner's invoking function calls for minting and burning.
    """
    return _totalSupply(GetContext())


def BalanceOf(account):
    """
    Gets the SPKZ token balance of an account.
    :param account: account
    """
    return _balanceOf(GetContext(), account)


def Transfer(_from, _to, _value):
    """
    Sends the amount of tokens from address `from` to address `to`. The parameter
    `from` must be the invoker.
    :param _from: invoker address.
    :param _to: receiver address.
    :param _value: SPKZ amount.
    """
    RequireWitness(_from)           # from address validation
    return _transfer(GetContext(), _from, _to, _value)


def TransferFrom(_originator, _from, _to, _amount):
    """
    Transfers the amount of tokens in `from` address to `to` address by invoker.
    Only approved amount can be sent.
    :param _originator: invoker address.
    :param _from: address for withdrawing.
    :param _to: address to receive.
    :param _amount: SPKZ amount.
    """
    return _transferFrom(GetContext(), _originator, _from, _to, _amount)


def Approve(_from, _to, _amount):
    """
    Approves `to` address to withdraw SPKZ token from the invoker's address. It
    overwrites the previous approval value.
    :param _from: invoker address.
    :param _to: address to approve.
    :param _amount: SPKZ amount to approve.
    """
    RequireWitness(_from)       # only the token owner can approve
    return _approve(GetContext(), _from, _to, _amount)


def Burn(_amount):
    """
    Burns the amount of SPKZ token from the owner's address.
    :param _amount: SPKZ amount to burn.
    """
    ctx = GetContext()
    _onlyOwner(ctx)                             # only owner can burn the token
    return _burn(ctx, Get(ctx, OWNER_KEY), _amount)


def Mint(_to, _amount):
    """
    Mints the amount of SPKZ token.
    :param _to: address to receive token.
    :param _amount: the amount to mint.
    """
    ctx = GetContext()
    _onlyOwner(ctx)                 # only owner can mint token
    return _mint(ctx, _to, _amount)


def TransferOwnership(_account):
    """
    Transfers the ownership of this contract to other.
    :param _account: address to transfer ownership.
    """
    ctx = GetContext()
    _onlyOwner(ctx)
    return _transferOwnership(ctx, _account)


def Allowance(_from, _to):
    """
    Gets the amount of allowance from address `from` to address `to`.
    :param _from: from address
    :param _to: to address
    :return: the amount of allowance.
    """
    return _allowance(GetContext(), _from, _to)


################################################################################
# INTERNAL FUNCTIONS
# Internal functions checks parameter and storage result validation but these
# wouldn't check the witness validation, so caller function must check the
# witness if necessary.

def _transfer(_context, _from, _to, _value):
    Require(_value > 0)             # transfer value must be over 0
    RequireScriptHash(_to)          # to-address validation

    from_val = _accountValue(_context, _from)
    to_val = _accountValue(_context, _to)

    from_val = uSub(from_val, _value)
    to_val = to_val + _value

    SafePut(_context, concat(OWN_PREFIX, _from), from_val)
    SafePut(_context, concat(OWN_PREFIX, _to), to_val)

    return True


def _balanceOf(_context, _account):
    RequireScriptHash(_account)
    return Get(_context, concat(OWN_PREFIX, _account))


def _transferFrom(_context, _originator, _from, _to, _amount):
    RequireWitness(_originator)
    RequireScriptHash(_from)
    RequireScriptHash(_to)

    Require(_amount > 0)

    approve_key = concat(ALLOWANCE_PREFIX, concat(_from, _originator))
    approve_amount = Get(_context, approve_key)
    approve_amount = uSub(approve_amount, _amount)

    _transfer(_context, _from, _to, _amount)
    SafePut(_context, approve_key, approve_amount)

    return True


def _approve(_context, _from, _to, _amount):
    RequireScriptHash(_to)          # to-address validation
    Require(_amount >= 0)           # amount must be not minus value

    from_val = _accountValue(_context, _from)

    Require(from_val >= _amount)    # the token owner must have the amount over approved

    approve_key = concat(ALLOWANCE_PREFIX, concat(_from, _to))
    SafePut(_context, approve_key, _amount)

    return True


def _burn(_context, _account, _amount):
    Require(_amount > 0)                # the amount to burn should be over 0

    account_val = _balanceOf(_context, _account)
    total_supply = _totalSupply(_context)

    Require(_amount < total_supply)     # should be not over total supply

    # burn the token from account. It also subtract the total supply
    account_val = uSub(account_val, _amount)
    total_supply = uSub(total_supply, _amount)

    SafePut(_context, concat(OWN_PREFIX, _account), account_val)
    SafePut(_context, SPKZ_SUPPLY_KEY, total_supply)
    return True


def _mint(_context, _to, _amount):
    Require(_amount > 0)            # mint value must be over 0
    RequireScriptHash(_to)          # to address should

    total_supply = _totalSupply(_context)
    to_val = _accountValue(_context, _to)

    # Add total supply value and give the token to the to-address
    total_supply += _amount
    to_val += _amount

    SafePut(_context, SPKZ_SUPPLY_KEY, total_supply)
    SafePut(_context, concat(OWN_PREFIX, _to), to_val)
    return True


def _transferOwnership(_context, _account):
    RequireScriptHash(_account)
    Put(_context, OWNER_KEY, _account)


################################################################################
# modifiers

def _onlyOwner(_context):
    """
    Checks the invoker is the contract owner or not. Owner key is saved in the
    storage key `___OWNER`, so check its value and invoker.
    """
    RequireWitness(Get(_context, OWNER_KEY))


################################################################################
#

def _accountValue(_context, _account):
    return Get(_context, concat(OWN_PREFIX, _account))


def _totalSupply(_context):
    return Get(_context, SPKZ_SUPPLY_KEY)


def _allowance(_context, _from, _to):
    return Get(_context, concat(ALLOWANCE_PREFIX, concat(_from, _to)))
