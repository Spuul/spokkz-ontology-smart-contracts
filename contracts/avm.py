import argparse
import binascii


def hexlify_avm(blob):
    return binascii.hexlify(blob).decode('ascii')


def read_avm(filename):
    with open(filename, 'rb') as f:
        return hexlify_avm(f.read())


if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('input', metavar='I', type=str, nargs='+', help='File glob patterns to compile')
    args = args.parse_args()
    for avm_file in args.input:
        print(read_avm(avm_file))
