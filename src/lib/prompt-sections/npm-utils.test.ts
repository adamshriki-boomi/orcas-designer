import { normalizeNpmPackage } from './npm-utils'

describe('normalizeNpmPackage', () => {
  it('returns bare package name unchanged', () => {
    expect(normalizeNpmPackage('@boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "npm install" prefix', () => {
    expect(normalizeNpmPackage('npm install @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "npm i" prefix', () => {
    expect(normalizeNpmPackage('npm i @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "npm add" prefix', () => {
    expect(normalizeNpmPackage('npm add @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "yarn add" prefix', () => {
    expect(normalizeNpmPackage('yarn add @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "pnpm add" prefix', () => {
    expect(normalizeNpmPackage('pnpm add @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "pnpm install" prefix', () => {
    expect(normalizeNpmPackage('pnpm install @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "pnpm i" prefix', () => {
    expect(normalizeNpmPackage('pnpm i @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "bun add" prefix', () => {
    expect(normalizeNpmPackage('bun add @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('strips "bun install" prefix', () => {
    expect(normalizeNpmPackage('bun install @boomi/exosphere')).toBe('@boomi/exosphere')
  })

  it('preserves version specifier', () => {
    expect(normalizeNpmPackage('npm i @boomi/exosphere@7.8.1')).toBe('@boomi/exosphere@7.8.1')
  })

  it('handles leading/trailing whitespace', () => {
    expect(normalizeNpmPackage('  npm i @boomi/exosphere  ')).toBe('@boomi/exosphere')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeNpmPackage('')).toBe('')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeNpmPackage('   ')).toBe('')
  })

  it('is case-insensitive for the prefix', () => {
    expect(normalizeNpmPackage('NPM INSTALL @boomi/exosphere')).toBe('@boomi/exosphere')
  })
})
