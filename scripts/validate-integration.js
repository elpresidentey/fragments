#!/usr/bin/env node

/**
 * Integration Validation Script
 * 
 * This script validates that all Twitter-like UI improvements are properly integrated
 * by checking for the presence of key files and components.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Twitter-like UI Integration...\n');

// Define validation checks
const validationChecks = [
  {
    name: 'Design System Integration',
    checks: [
      {
        type: 'file',
        path: 'design-system/index.ts',
        description: 'Design system exports'
      },
      {
        type: 'file',
        path: 'design-system/theme/theme-engine.ts',
        description: 'Theme engine implementation'
      },
      {
        type: 'file',
        path: 'design-system/theme/colors.ts',
        description: 'Twitter-inspired color palette'
      },
      {
        type: 'file',
        path: 'design-system/theme/typography.ts',
        description: 'Typography system'
      },
      {
        type: 'content',
        path: 'design-system/theme/colors.ts',
        content: '#1DA1F2',
        description: 'Twitter blue primary color'
      }
    ]
  },
  {
    name: 'Enhanced Components',
    checks: [
      {
        type: 'file',
        path: 'components/post-card.tsx',
        description: 'Enhanced post card component'
      },
      {
        type: 'file',
        path: 'components/twitter-header.tsx',
        description: 'Twitter-style header component'
      },
      {
        type: 'file',
        path: 'components/twitter-icon.tsx',
        description: 'Twitter-style icon component'
      },
      {
        type: 'content',
        path: 'components/post-card.tsx',
        content: 'engagement',
        description: 'Engagement actions in post card'
      },
      {
        type: 'content',
        path: 'components/post-card.tsx',
        content: 'verified',
        description: 'Verified badge support'
      }
    ]
  },
  {
    name: 'Animation System',
    checks: [
      {
        type: 'file',
        path: 'design-system/hooks/use-animation.ts',
        description: 'Animation hooks'
      },
      {
        type: 'file',
        path: 'design-system/utils/animation-utils.ts',
        description: 'Animation utilities'
      },
      {
        type: 'file',
        path: 'components/animated-button.tsx',
        description: 'Animated button component'
      },
      {
        type: 'content',
        path: 'design-system/theme/animations.ts',
        content: 'quick: 200',
        description: 'Animation timing constants'
      }
    ]
  },
  {
    name: 'Accessibility Features',
    checks: [
      {
        type: 'file',
        path: 'design-system/hooks/use-accessibility.ts',
        description: 'Accessibility hooks'
      },
      {
        type: 'file',
        path: 'design-system/utils/accessibility-utils.ts',
        description: 'Accessibility utilities'
      },
      {
        type: 'content',
        path: 'design-system/utils/accessibility-utils.ts',
        content: 'getContrastRatio',
        description: 'Contrast ratio validation'
      },
      {
        type: 'content',
        path: 'components/post-card.tsx',
        content: 'accessibilityLabel',
        description: 'Accessibility labels in components'
      }
    ]
  },
  {
    name: 'Navigation Integration',
    checks: [
      {
        type: 'file',
        path: 'app/(tabs)/_layout.tsx',
        description: 'Enhanced tab navigation'
      },
      {
        type: 'content',
        path: 'app/(tabs)/_layout.tsx',
        content: 'floatingButton',
        description: 'Floating compose button'
      },
      {
        type: 'content',
        path: 'app/(tabs)/_layout.tsx',
        content: 'TwitterIcon',
        description: 'Twitter-style icons in navigation'
      }
    ]
  },
  {
    name: 'Create Post Interface',
    checks: [
      {
        type: 'file',
        path: 'app/(tabs)/create.tsx',
        description: 'Enhanced create post screen'
      },
      {
        type: 'content',
        path: 'app/(tabs)/create.tsx',
        content: 'characterCount',
        description: 'Character counter implementation'
      },
      {
        type: 'content',
        path: 'app/(tabs)/create.tsx',
        content: 'imagePreview',
        description: 'Image preview functionality'
      }
    ]
  },
  {
    name: 'Performance Optimizations',
    checks: [
      {
        type: 'file',
        path: 'design-system/utils/performance-utils.ts',
        description: 'Performance utilities'
      },
      {
        type: 'file',
        path: 'design-system/utils/memoization-utils.ts',
        description: 'Memoization utilities'
      },
      {
        type: 'file',
        path: 'design-system/utils/optimized-animations.ts',
        description: 'Optimized animations'
      },
      {
        type: 'content',
        path: 'components/post-card.tsx',
        content: 'memoCustom',
        description: 'Component memoization'
      }
    ]
  }
];

// Validation functions
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(__dirname, '..', filePath));
  } catch (error) {
    return false;
  }
}

function fileContains(filePath, content) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) return false;
    
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    return fileContent.includes(content);
  } catch (error) {
    return false;
  }
}

// Run validation
let totalChecks = 0;
let passedChecks = 0;
const results = [];

for (const category of validationChecks) {
  console.log(`📋 ${category.name}`);
  
  const categoryResults = {
    name: category.name,
    checks: [],
    passed: 0,
    total: category.checks.length
  };
  
  for (const check of category.checks) {
    totalChecks++;
    let passed = false;
    
    if (check.type === 'file') {
      passed = fileExists(check.path);
    } else if (check.type === 'content') {
      passed = fileContains(check.path, check.content);
    }
    
    if (passed) {
      passedChecks++;
      categoryResults.passed++;
      console.log(`  ✅ ${check.description}`);
    } else {
      console.log(`  ❌ ${check.description} (${check.path})`);
    }
    
    categoryResults.checks.push({
      description: check.description,
      passed,
      path: check.path
    });
  }
  
  console.log(`  📊 ${categoryResults.passed}/${categoryResults.total} checks passed\n`);
  results.push(categoryResults);
}

// Summary
console.log('📈 INTEGRATION VALIDATION SUMMARY');
console.log('=' .repeat(50));
console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${totalChecks - passedChecks}`);
console.log(`Success Rate: ${Math.round((passedChecks / totalChecks) * 100)}%\n`);

// Category breakdown
for (const result of results) {
  const percentage = Math.round((result.passed / result.total) * 100);
  const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
  console.log(`${status} ${result.name}: ${result.passed}/${result.total} (${percentage}%)`);
}

console.log('\n🎯 INTEGRATION STATUS');
console.log('=' .repeat(50));

if (passedChecks === totalChecks) {
  console.log('🎉 ALL CHECKS PASSED - INTEGRATION COMPLETE!');
  console.log('✨ Twitter-like UI improvements are fully integrated and ready for use.');
} else if (passedChecks >= totalChecks * 0.9) {
  console.log('🟡 MOSTLY COMPLETE - Minor issues detected');
  console.log('🔧 Most features are integrated, but some components may need attention.');
} else if (passedChecks >= totalChecks * 0.7) {
  console.log('🟠 PARTIALLY COMPLETE - Some integration issues');
  console.log('⚠️  Core features are integrated, but several components need work.');
} else {
  console.log('🔴 INTEGRATION INCOMPLETE - Major issues detected');
  console.log('🚨 Significant integration work is still needed.');
}

console.log('\n📝 NEXT STEPS');
console.log('=' .repeat(50));

if (passedChecks === totalChecks) {
  console.log('• Run the app to test the Twitter-like UI improvements');
  console.log('• Verify theme switching functionality');
  console.log('• Test accessibility features with screen readers');
  console.log('• Validate animation performance on different devices');
} else {
  console.log('• Review failed checks and ensure all files are properly created');
  console.log('• Verify component imports and exports');
  console.log('• Check for any missing dependencies or configuration');
  console.log('• Re-run this validation script after making fixes');
}

console.log('\n🏁 Validation Complete!');

// Exit with appropriate code
process.exit(passedChecks === totalChecks ? 0 : 1);