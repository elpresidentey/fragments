describe('Project Setup', () => {
  it('should have basic configuration working', () => {
    expect(true).toBe(true)
  })

  it('should be able to import Supabase client', () => {
    const { supabase } = require('../lib/supabase')
    expect(supabase).toBeDefined()
  })

  it('should have TypeScript types available', () => {
    const types = require('../types/index')
    expect(types).toBeDefined()
  })
})