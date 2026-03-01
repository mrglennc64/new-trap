#!/usr/bin/env python3

with open('/root/traproyalties-new/packages/frontend/app/attorney-portal/page.tsx', 'r') as f:
    content = f.read()

# 1. Add Link import if not present
if "import Link from 'next/link'" not in content:
    content = content.replace(
        "import { useState } from 'react';",
        "import { useState } from 'react';\nimport Link from 'next/link';"
    )

# 2. Fix the navigation rendering to use Links
import re

# Find the navigation rendering section
nav_pattern = r'{navItems\.map\(\(item\) => \([\s\S]*?\)\)}'
nav_match = re.search(nav_pattern, content)

if nav_match:
    old_nav = nav_match.group(0)
    new_nav = """{navItems.map((item) => {
          const Icon = item.icon;
          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className="w-full">
                <button
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition text-gray-700 hover:bg-indigo-50`}
                >
                  <span className="text-xl">{Icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </Link>
            );
          } else {
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  activeSection === item.id
                    ? 'bg-indigo-100 text-indigo-900'
                    : 'text-gray-700 hover:bg-indigo-50'
                }`}
              >
                <span className="text-xl">{Icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          }
        })}"""
    content = content.replace(old_nav, new_nav)
    print("✅ Updated navigation to use Links")

# 3. Remove the inline content for pre-release-verify
section_pattern = r"\{activeSection === 'pre-release-verify' && \([\s\S]*?\)\}"
section_match = re.search(section_pattern, content)

if section_match:
    old_section = section_match.group(0)
    # Replace with a redirect notice or remove entirely
    new_section = """{activeSection === 'pre-release-verify' && (
            <div className="text-center py-12">
              <p className="text-gray-500">Redirecting to Pre-Release Verification page...</p>
              <p className="text-sm text-gray-400 mt-2">
                <Link href="/attorney-portal/pre-release-verify" className="text-indigo-600 hover:underline">
                  Click here if not redirected
                </Link>
              </p>
            </div>
          )}"""
    content = content.replace(old_section, new_section)
    print("✅ Updated inline content to redirect")

# Write the changes
with open('/root/traproyalties-new/packages/frontend/app/attorney-portal/page.tsx', 'w') as f:
    f.write(content)

print("\n🎉 Fix applied! Now restart Next.js and clear cache.")
