from boa.interop.System.ExecutionEngine import GetExecutingScriptHash
from boa.interop.System.Runtime import *
from boa.interop.System.App import RegisterAppCall
from libs.SafeCheck import *

DEPLOYER = ToScriptHash('Ac725LuR7wo481zvNmc9jerqCzoCArQjtw')
OWNER_KEY = '___OWNER'

ctx = GetContext()

def main(operation, args):
    if operation == 'deploy':
        return deploy()
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
    # TODO: can transfer ownership to other by calling `TransferOwner` function
    Put(ctx, OWNER_KEY, DEPLOYER)

    return True

def transferOwnership(_account):
    """
    Transfers the ownership of this contract to other.
    :param _account: address to transfer ownership.
    """
    _onlyOwner()
    Require(_transferOwnership(_account))
    return True


################################################################################
# INTERNAL FUNCTIONS
# Internal functions checks parameter and storage result validation but these
# wouldn't check the witness validation, so caller function must check the
# witness if necessary.

def _transferOwnership(_account):
    RequireScriptHash(_account)
    Put(ctx, OWNER_KEY, _account)
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
