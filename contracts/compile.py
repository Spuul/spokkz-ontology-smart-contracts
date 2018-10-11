import os
import argparse
from boa.compiler import Compiler
from glob import glob

throw_conversion = bytes.fromhex(
    '09f7f6f5f4f3f2f1f000f0'
)


def compile_contract(file, out_dir=None, export_debug=True, print_code=True):
    compiler = Compiler.load(file)
    basename, _ = os.path.splitext(os.path.basename(file))

    if not out_dir:
        out_dir = os.path.dirname(file)

    # if out directory doesn't exist, create the directory
    if not os.path.exists(out_dir):
        os.mkdir(out_dir)

    output_path = os.path.join(out_dir, '{}.avm'.format(basename))

    avm_code = compiler.write().replace(throw_conversion, b'\xff' * len(throw_conversion))
    compiler.write_file(avm_code, output_path)

    if export_debug:
        compiler.entry_module.export_debug(output_path)

    if print_code:
        print('## {} ##'.format(basename))
        compiler.entry_module.to_s()


def compile_match_files(glob_pattern, out_dir=None, export_debug=True, print_code=True):
    for file in glob(glob_pattern):
        basename, ext = os.path.splitext(os.path.basename(file))

        if ext != '.py' or basename in ('__init__', ):
            continue

        compile_contract(file, out_dir, export_debug, print_code)


if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('input', metavar='I', type=str, nargs='+', help='File glob patterns to compile')
    args.add_argument('--out', '-o', type=str, help='output directory', default='build')
    args.add_argument('--export-debug', action='store_true')
    args = args.parse_args()

    for pattern in args.input:
        compile_match_files(pattern, args.out, args.export_debug)