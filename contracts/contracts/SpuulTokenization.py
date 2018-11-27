from boa.interop.System.ExecutionEngine import GetExecutingScriptHash
from boa.interop.System.Runtime import *
from boa.interop.System.App import RegisterAppCall, DynamicAppCall
from libs.SafeCheck import *

SpokkzOEP4Contract = RegisterAppCall('5682464183f3972abbf72105a8e2a89ac5083a90', 'operation', 'args')

DEPLOYER = ToScriptHash('Ac725LuR7wo481zvNmc9jerqCzoCArQjtw')

OWNER_KEY = '___OWNER'

PAYMENT_PREFIX = '_____pay'

ctx = GetContext()

def main(operation, args):
    if operation == 'deploy':
        return deploy()
    if operation == 'name':
        return name()
    if operation == 'transferz':
        return transferz(args)
    if operation == 'transferzFrom':
        if len(args) == 4:
            return transferzFrom(args[0],args[1],args[2],args[3])
        return transferzFrom(args)
    if operation == 'pay':
        if len(args) == 4:
            return pay(args[0],args[1],args[2],args[3])
    if operation == 'transferOwnership':
        if len(args) == 1:
            return transferOwnership(args[0])

    return False

def name():
    token_name = SpokkzOEP4Contract('name',0)
    Put(ctx, 'NAME', token_name)
    return True

def transferz(args):
    Require(CallOep4Contract('transfer', args))
    return True

def transferzFrom(_originator, _from, _to, _amount):
    originator = GetExecutingScriptHash()

    Require(CallOep4Contract('transferFrom', [originator, _from, _to, _amount]))
    return True

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
    # TODO: can transfer ownership to other by calling `TransferOwner` function
    Put(ctx, OWNER_KEY, DEPLOYER)

    return True


def pay(_from, _to, _amount, _orderId):
    Require(_pay(_from, _to, _amount, _orderId))
    return True

def transferOwnership(_account):
    """
    Transfers the ownership of this contract to other.
    :param _account: address to transfer ownership.
    """
    _onlyOwner()
    Require(_transferOwnership(_account))
    return True

def CallOep4Contract(operation, params):
    return SpokkzOEP4Contract(operation, params)


################################################################################
# INTERNAL FUNCTIONS
# Internal functions checks parameter and storage result validation but these
# wouldn't check the witness validation, so caller function must check the
# witness if necessary.

def _transferOwnership(_account):
    RequireScriptHash(_account)
    Put(ctx, OWNER_KEY, _account)
    return True

def _pay(_from, _to, _amount, _orderId):
    originator = GetExecutingScriptHash()

    RequireScriptHash(_from)
    RequireScriptHash(_to)

    Require(_amount > 0)

    Require(CallOep4Contract('transferFrom', [originator,_from, _to, _amount]))

    payment_key = concat(PAYMENT_PREFIX, _orderId)
    Put(ctx, payment_key, _amount)
    return True

################################################################################
# modifiers

def _onlyOwner():
    """
    Checks the invoker is the contract owner or not. Owner key is saved in the
    storage key `___OWNER`, so check its value and invoker.
    """
    owner = Get(ctx, OWNER_KEY)
    RequireWitness(owner)
    return True


################################################################################
#
