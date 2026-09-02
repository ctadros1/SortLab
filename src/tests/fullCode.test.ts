// @ts-expect-error Test-only compiler subprocess; the browser tsconfig intentionally omits Node globals.
import { spawnSync } from 'node:child_process'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { visualizeAlgorithmRegistry } from '../algorithms/registry'
import { codeLanguages } from '../code/algorithmCode'
import { getFullAlgorithmCode } from '../code/fullAlgorithmCode'

describe('full algorithm code', () => {
  it('provides substantial full code in every requested language for every Visualize/Compare algorithm', () => {
    expect(codeLanguages.map((language) => language.id)).toEqual([
      'pseudocode',
      'c_cpp',
      'java',
      'python',
      'typescript',
    ])
    expect(visualizeAlgorithmRegistry).toHaveLength(44)
    for (const algorithm of visualizeAlgorithmRegistry) {
      for (const language of codeLanguages) {
        const result = getFullAlgorithmCode(algorithm, language.id)
        expect(result.lines.length, `${algorithm.id}/${language.id}`).toBeGreaterThan(8)
        expect(
          result.lines.some((line) => line.text.includes(functionName(algorithm.id))),
          `${algorithm.id}/${language.id}`,
        ).toBe(true)
        expect(result.note.length).toBeGreaterThan(40)
      }
    }
  })

  it('uses language-specific syntax rather than the guided operation stubs', () => {
    const quick = visualizeAlgorithmRegistry.find((algorithm) => algorithm.id === 'quick')!
    const python = getFullAlgorithmCode(quick, 'python')
      .lines.map((line) => line.text)
      .join('\n')
    const cpp = getFullAlgorithmCode(quick, 'c_cpp')
      .lines.map((line) => line.text)
      .join('\n')
    const java = getFullAlgorithmCode(quick, 'java')
      .lines.map((line) => line.text)
      .join('\n')
    const typescript = getFullAlgorithmCode(quick, 'typescript')
      .lines.map((line) => line.text)
      .join('\n')
    expect(python).toContain('def quick(')
    expect(python).toContain('while ')
    expect(cpp).toContain('std::vector<int>& a')
    expect(java).toContain('static void quick(int[] a)')
    expect(typescript).toContain('export function quick(a: number[]): void')
    for (const source of [python, cpp, java, typescript]) {
      expect(source).not.toContain('state satisfies SortState')
      expect(source).not.toContain('choose_pivot(a, state)')
    }
  })

  it('emits syntactically valid Python for the full registry', () => {
    for (const algorithm of visualizeAlgorithmRegistry) {
      const source = getFullAlgorithmCode(algorithm, 'python')
        .lines.map((line) => line.text)
        .join('\n')
      const result = spawnSync(
        'python3',
        ['-c', 'import sys; compile(sys.stdin.read(), "<sortlab>", "exec")'],
        { input: source, encoding: 'utf8' },
      )
      expect(result.status, `${algorithm.id}: ${result.stderr}`).toBe(0)
    }
  })

  it('emits syntactically valid C++17 for the combined C/C++ option', () => {
    for (const algorithm of visualizeAlgorithmRegistry) {
      const source = getFullAlgorithmCode(algorithm, 'c_cpp')
        .lines.map((line) => line.text)
        .join('\n')
      const result = spawnSync('c++', ['-std=c++17', '-fsyntax-only', '-x', 'c++', '-'], {
        input: source,
        encoding: 'utf8',
      })
      expect(result.status, `${algorithm.id}: ${result.stderr}`).toBe(0)
    }
  }, 30_000)

  it('emits runnable TypeScript that sorts representative inputs', () => {
    for (const algorithm of visualizeAlgorithmRegistry) {
      const source = getFullAlgorithmCode(algorithm, 'typescript')
        .lines.map((line) => line.text)
        .join('\n')
      const compiled = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
        reportDiagnostics: true,
      })
      const errors = compiled.diagnostics?.filter(
        (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
      )
      expect(errors, algorithm.id).toEqual([])
      const exports: Record<string, (values: number[]) => void> = {}
      new Function('exports', compiled.outputText)(exports)
      const implementation = exports[functionName(algorithm.id)]
      expect(implementation, algorithm.id).toBeTypeOf('function')
      const values = [7, 2, 6, 1, 5, 3, 4, 0]
      try {
        implementation(values)
      } catch (error) {
        throw new Error(
          `${algorithm.id}: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        )
      }
      expect(values, algorithm.id).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    }
  })
})

function functionName(id: string) {
  return id.replaceAll('-', '_')
}
