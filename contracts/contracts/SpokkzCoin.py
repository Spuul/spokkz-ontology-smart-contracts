from boa.interop.System.Runtime import *
from boa.interop.System.Storage import *
from boa.builtins import *

from libs.SafeMath import *
from libs.SafeCheck import *
from libs.Utils import *

ctx = GetContext()

TOKEN_NAME = 'Spokkz Token'
TOKEN_SYMBOL = 'SPKZ'

################################################################################
# TOKEN INFO CONSTANTS

DEPLOYER = ToScriptHash('Ac725LuR7wo481zvNmc9jerqCzoCArQjtw')
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

def main(operation, args):
    if operation == 'deploy':
        return deploy()
    if operation == 'name':
        return TOKEN_NAME
    if operation == 'decimals':
        return TOKEN_DECIMALS
    if operation == 'symbol':
        return TOKEN_SYMBOL
    if operation == 'totalSupply':
        return totalSupply()
    if operation == 'balanceOf':
        if len(args) == 1:
            return balanceOf(args[0])
    if operation == 'transfer':
        if len(args) == 3:
            return transfer(args[0], args[1], args[2])
    if operation == 'transferMulti':
        return transferMulti(args)
    if operation == 'transferFrom':
        if len(args) == 4:
            return transferFrom(args[0], args[1], args[2], args[3])
    if operation == 'approve':
        if len(args) == 3:
            return approve(args[0], args[1], args[2])
    if operation == 'allowance':
        if len(args) == 2:
            return allowance(args[0], args[1])
    if operation == 'burn':
        if len(args) == 1:
            return burn(args[0])
    if operation == 'transferOwnership':
        if len(args) == 1:
            return transferOwnership(args[0])

    return False

def deploy():
    """
    Constructor of this contract. Only deployer hard-coded can call this function
    and cannot call this function after called once.
    Followings are initialization list for this token
    1. Transfer the owner to the deployer. (Owner can burn the token)
    2. Supply initial coin to the deployer.
    """

    is_witness = CheckWitness(DEPLOYER)
    is_deployed = Get(ctx, 'DEPLOYED')
    Require(is_witness)                     # only can be initialized by deployer
    Require(not is_deployed)                # only can deploy once

    # disable to deploy again
    Put(ctx, 'DEPLOYED', 1)

    # the first owner is the deployer
    # can transfer ownership to other by calling `TransferOwner` function
    Put(ctx, OWNER_KEY, DEPLOYER)

    # supply the coin. All coin will be belong to deployer.
    total = INIT_SUPPLY * FACTOR
    Put(ctx, SPKZ_SUPPLY_KEY, total)
    deployer_key = concat(OWN_PREFIX, DEPLOYER)
    Put(ctx, deployer_key, total)
    Notify(['transfer', '', DEPLOYER, total])
    return True


def totalSupply():
    """
    Gets the total supply for SPKZ token. The total supply can be changed by
    owner's invoking function calls for burning.
    """
    return _totalSupply()


def balanceOf(account):
    """
    Gets the SPKZ token balance of an account.
    :param account: account
    """
    balance = _balanceOf(account)
    return balance


def transfer(_from, _to, _value):
    """
    Sends the amount of tokens from address `from` to address `to`. The parameter
    `from` must be the invoker.
    :param _from: invoker address.
    :param _to: receiver address.
    :param _value: SPKZ amount.
    """
    RequireWitness(_from)           # from address validation
    _transfer(_from, _to, _value)
    Notify(['transfer', _from, _to, _value])
    return True


def transferMulti(args):
    """
    Sends tokens to the several people.
    :param args: transfer arguments array
    """
    for p in (args):
        arg_len = len(p)
        Require(arg_len == 3)
        transfer(p[0], p[1], p[2])
    return True


def transferFrom(_originator, _from, _to, _amount):
    """
    Transfers the amount of tokens in `from` address to `to` address by invoker.
    Only approved amount can be sent.
    :param _originator: invoker address.
    :param _from: address for withdrawing.
    :param _to: address to receive.
    :param _amount: SPKZ amount.
    """
    _transferFrom(_originator, _from, _to, _amount)
    Notify(['transfer', _from, _to, _amount])
    return True


def approve(_from, _to, _amount):
    """
    Approves `to` address to withdraw SPKZ token from the invoker's address. It
    overwrites the previous approval value.
    :param _from: invoker address.
    :param _to: address to approve.
    :param _amount: SPKZ amount to approve.
    """
    RequireWitness(_from)       # only the token owner can approve
    _approve(_from, _to, _amount)
    Notify(['approve', _from, _to, _amount])
    return True


def burn(_amount):
    """
    Burns the amount of SPKZ token from the owner's address.
    :param _amount: SPKZ amount to burn.
    """
    _onlyOwner(ctx)                             # only owner can burn the token
    owner_key = Get(ctx, OWNER_KEY)
    burned = _burn(owner_key, _amount)
    Notify(['burn', _amount])
    return burned

def transferOwnership(_account):
    """
    Transfers the ownership of this contract to other.
    :param _account: address to transfer ownership.
    """
    _onlyOwner(ctx)
    transferred = _transferOwnership(ctx, _account)
    return transferred


def allowance(_from, _to):
    """
    Gets the amount of allowance from address `from` to address `to`.
    :param _from: from address
    :param _to: to address
    :return: the amount of allowance.
    """
    allowance = _allowance(ctx, _from, _to)
    return allowance


################################################################################
# INTERNAL FUNCTIONS
# Internal functions checks parameter and storage result validation but these
# wouldn't check the witness validation, so caller function must check the
# witness if necessary.

def _transfer(_from, _to, _value):
    Require(_value > 0)             # transfer value must be over 0
    RequireScriptHash(_to)          # to-address validation

    from_key = concat(OWN_PREFIX, _from)
    to_key = concat(OWN_PREFIX, _to)

    from_val = Get(ctx, from_key)
    to_val = Get(ctx, to_key)

    from_val = uSub(from_val, _value)
    to_val = to_val + _value

    SafePut(ctx, from_key, from_val)
    SafePut(ctx, to_key, to_val)

    return True


def _balanceOf(_account):
    RequireScriptHash(_account)
    account_key = concat(OWN_PREFIX, _account)
    balance = Get(ctx, account_key)
    return balance


def _transferFrom(_originator, _from, _to, _amount):
    RequireWitness(_originator)
    RequireScriptHash(_from)
    RequireScriptHash(_to)

    Require(_amount > 0)

    from_to_key = concat(_from, _originator)
    approve_key = concat(ALLOWANCE_PREFIX, from_to_key)
    approve_amount = Get(ctx, approve_key)
    approve_amount = uSub(approve_amount, _amount)

    _transfer(_from, _to, _amount)
    SafePut(ctx, approve_key, approve_amount)

    return True


def _approve(_from, _to, _amount):
    RequireScriptHash(_to)          # to-address validation
    Require(_amount >= 0)           # amount must be not minus value

    from_val = _accountValue(_from)

    Require(from_val >= _amount)    # the token owner must have the amount over approved

    from_to_key = concat(_from, _to)
    approve_key = concat(ALLOWANCE_PREFIX, from_to_key)
    SafePut(ctx, approve_key, _amount)

    return True


def _burn(_account, _amount):
    Require(_amount > 0)                # the amount to burn should be over 0

    account_val = _balanceOf(_account)
    total_supply = _totalSupply()

    # burn the token from account. It also subtract the total supply
    account_val = uSub(account_val, _amount)
    total_supply = uSub(total_supply, _amount)

    account_key = concat(OWN_PREFIX, _account)
    SafePut(_context, account_key, account_val)
    SafePut(_context, SPKZ_SUPPLY_KEY, total_supply)
    return True


def _transferOwnership(_context, _account):
    RequireScriptHash(_account)
    Put(_context, OWNER_KEY, _account)
    return True


################################################################################
# modifiers

def _onlyOwner(_context):
    """
    Checks the invoker is the contract owner or not. Owner key is saved in the
    storage key `___OWNER`, so check its value and invoker.
    """
    owner = Get(_context, OWNER_KEY)
    RequireWitness(owner)
    return True


################################################################################
#

def _accountValue(_account):
    account_key = concat(OWN_PREFIX, _account)
    account_balance = Get(ctx, account_key)
    return account_balance


def _totalSupply():
    total_supply = Get(ctx, SPKZ_SUPPLY_KEY)
    return total_supply


def _allowance(_context, _from, _to):
    from_to_key = concat(_from, _to)
    allowance_key = concat(ALLOWANCE_PREFIX, from_to_key)
    allowance = Get(_context, allowance_key)
    return allowance
