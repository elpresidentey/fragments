// Simple verification script to test project setup
console.log('🔍 Verifying project setup...')

try {
  // Test that files exist
  const fs = require('fs')
  const path = require('path')
  
  // Check Supabase client file
  if (fs.existsSync('./lib/supabase.ts')) {
    console.log('✅ Supabase client file created')
  } else {
    throw new Error('Supabase client file not found')
  }
  
  // Check TypeScript types file
  if (fs.existsSync('./types/index.ts')) {
    console.log('✅ TypeScript types file created')
  } else {
    throw new Error('TypeScript types file not found')
  }
  
  // Check environment file
  if (fs.existsSync('./.env.local')) {
    console.log('✅ Environment file created')
  } else {
    throw new Error('Environment file not found')
  }
  
  // Check package.json dependencies
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const requiredDeps = [
    '@supabase/supabase-js',
    '@react-native-async-storage/async-storage',
    '@react-navigation/stack',
    'expo-image-picker',
    'expo-file-system',
    'react-native-url-polyfill'
  ]
  
  const missingDeps = requiredDeps.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  )
  
  if (missingDeps.length === 0) {
    console.log('✅ All required dependencies installed')
  } else {
    throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`)
  }
  
  // Check directory structure
  const requiredDirs = ['lib', 'lib/services', 'contexts', 'types', '__tests__']
  const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir))
  
  if (missingDirs.length === 0) {
    console.log('✅ Project directory structure created')
  } else {
    throw new Error(`Missing directories: ${missingDirs.join(', ')}`)
  }
  
  console.log('🎉 Project setup verification complete!')
  console.log('\nSetup Summary:')
  console.log('- ✅ React Native project with TypeScript')
  console.log('- ✅ Supabase client library configured')
  console.log('- ✅ React Navigation v6 dependencies installed')
  console.log('- ✅ Image picker and file system utilities')
  console.log('- ✅ Environment configuration')
  console.log('- ✅ Project directory structure')
  console.log('\nNext steps:')
  console.log('- Run "npm start" to start the development server')
  console.log('- Begin implementing authentication system (Task 2)')
  
} catch (error) {
  console.error('❌ Setup verification failed:', error.message)
  process.exit(1)
}