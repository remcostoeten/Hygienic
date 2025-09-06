import { promises as fs } from 'fs'
import { join } from 'path'

import { Config } from '../src/config'
import { UIImportConsolidator } from '../src/consolidator'
import { cleanup, createTestConfig, createTestFile } from './utils'

describe('Integration Tests', () => {
	let tempDir: string
	let config: Config
	let consolidator: UIImportConsolidator

	beforeEach(async () => {
		const { config: testConfig, tempDir: testTempDir } = await createTestConfig()
		config = testConfig
		tempDir = testTempDir
		consolidator = new UIImportConsolidator(config, false, true)
	})

	afterEach(async () => {
		await cleanup(tempDir)
	})

	describe('real-world scenarios', () => {
		test('should handle a typical React project structure', async () => {
			const barrelContent = `export { Button } from './button';
export { Input } from './input';
export { Card } from './card';
export { Dialog } from './dialog';`

			await createTestFile(tempDir, 'src/shared/components/ui/index.ts', barrelContent)

			const homePageContent = `import React from 'react';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card } from '@/shared/components/ui/card';

export function HomePage() {
  const [value, setValue] = useState('');
  
  return (
    <Card>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={() => console.log('clicked')}>
        Submit
      </Button>
    </Card>
  );
}`

			const loginFormContent = `import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Dialog } from '@/shared/components/ui/dialog';

export function LoginForm({ onClose }: { onClose: () => void }) {
  return (
    <Dialog onClose={onClose}>
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Button type="submit">Login</Button>
    </Dialog>
  );
}`

			const dashboardContent = `import React from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';

export function Dashboard() {
  return (
    <div>
      <Card>
        <h1>Dashboard</h1>
        <Button>Action</Button>
      </Card>
    </div>
  );
}`

			await createTestFile(tempDir, 'src/pages/HomePage.tsx', homePageContent)
			await createTestFile(tempDir, 'src/components/LoginForm.tsx', loginFormContent)
			await createTestFile(tempDir, 'src/pages/Dashboard.tsx', dashboardContent)

			await config.set('barrelPaths', [join(tempDir, 'src/shared/components/ui/index.ts')])
			await consolidator.initialize()

			const results = await consolidator.processFiles([join(tempDir, 'src')], false, true)

			expect(results.length).toBe(3)

			const homeResult = results.find(r => r.filePath.includes('HomePage.tsx'))
			const loginResult = results.find(r => r.filePath.includes('LoginForm.tsx'))
			const dashboardResult = results.find(r => r.filePath.includes('Dashboard.tsx'))

			expect(homeResult?.changed).toBe(true)
			expect(homeResult?.consolidatedImport).toBe(
				"import { Button, Card, Input } from '@/shared/components/ui';"
			)

			expect(loginResult?.changed).toBe(true)
			expect(loginResult?.consolidatedImport).toBe(
				"import { Button, Dialog, Input } from '@/shared/components/ui';"
			)

			expect(dashboardResult?.changed).toBe(true)
			expect(dashboardResult?.consolidatedImport).toBe(
				"import { Button, Card } from '@/shared/components/ui';"
			)

			const modifiedHomePage = await fs.readFile(
				join(tempDir, 'src/pages/HomePage.tsx'),
				'utf-8'
			)
			expect(modifiedHomePage).toContain(
				"import { Button, Card, Input } from '@/shared/components/ui';"
			)
			expect(modifiedHomePage).not.toContain("from '@/shared/components/ui/button'")
			expect(modifiedHomePage).toContain("import React from 'react';")
			expect(modifiedHomePage).toContain("import { useState } from 'react';")
		})

		test('should handle complex project with mixed imports', async () => {
			const barrelContent = `export { Button } from './button';
export { Input } from './input';
export { Select } from './select';
export { Textarea } from './textarea';
export { Label } from './label';`

			await createTestFile(tempDir, 'src/ui/index.ts', barrelContent)

			const formComponentContent = `import React, { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const formSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string()
});

export function ContactForm() {
  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  return (
    <form>
      <Label htmlFor="name">Name</Label>
      <Input id="name" {...form.register('name')} />
      
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" {...form.register('email')} />
      
      <Label htmlFor="type">Type</Label>
      <Select {...form.register('type')}>
        <option value="general">General</option>
        <option value="support">Support</option>
      </Select>
      
      <Label htmlFor="message">Message</Label>
      <Textarea id="message" {...form.register('message')} />
      
      <Button type="submit">Send Message</Button>
    </form>
  );
}`

			await createTestFile(tempDir, 'src/components/ContactForm.tsx', formComponentContent)

			await config.set('barrelPaths', [join(tempDir, 'src/ui/index.ts')])
			await consolidator.initialize()

			const results = await consolidator.processFiles([join(tempDir, 'src')], false, true)

			expect(results.length).toBe(1)
			expect(results[0].changed).toBe(true)
			expect(results[0].consolidatedImport).toBe(
				"import { Button, Input, Label, Select, Textarea } from '@/shared/components/ui';"
			)

			const modifiedContent = await fs.readFile(
				join(tempDir, 'src/components/ContactForm.tsx'),
				'utf-8'
			)
			expect(modifiedContent).toContain(
				"import { Button, Input, Label, Select, Textarea } from '@/shared/components/ui';"
			)
			expect(modifiedContent).toContain("import React, { useState } from 'react';")
			expect(modifiedContent).toContain(
				"import { zodResolver } from '@hookform/resolvers/zod';"
			)
			expect(modifiedContent).not.toContain("from '@/shared/components/ui/button'")
		})

		test('should handle files with no changes needed', async () => {
			const barrelContent = `export { Button } from './button';`
			await createTestFile(tempDir, 'src/ui/index.ts', barrelContent)

			const alreadyConsolidatedContent = `import React from 'react';
import { Button } from '@/shared/components/ui';

export function AlreadyGoodComponent() {
  return <Button>Click me</Button>;
}`

			const noUIImportsContent = `import React from 'react';
import { useState } from 'react';

export function NoUIComponent() {
  const [count, setCount] = useState(0);
  return <div onClick={() => setCount(count + 1)}>{count}</div>;
}`

			await createTestFile(
				tempDir,
				'src/components/AlreadyGood.tsx',
				alreadyConsolidatedContent
			)
			await createTestFile(tempDir, 'src/components/NoUI.tsx', noUIImportsContent)

			await config.set('barrelPaths', [join(tempDir, 'src/ui/index.ts')])
			await consolidator.initialize()

			const results = await consolidator.processFiles([join(tempDir, 'src')], false)

			expect(results.length).toBe(2)
			expect(results.every(r => !r.changed)).toBe(true)

			const alreadyGoodContent = await fs.readFile(
				join(tempDir, 'src/components/AlreadyGood.tsx'),
				'utf-8'
			)
			const noUIContent = await fs.readFile(join(tempDir, 'src/components/NoUI.tsx'), 'utf-8')

			expect(alreadyGoodContent).toBe(alreadyConsolidatedContent)
			expect(noUIContent).toBe(noUIImportsContent)
		})

		test('should preserve comments and formatting', async () => {
			const barrelContent = `export { Button } from './button';
export { Input } from './input';`

			await createTestFile(tempDir, 'src/ui/index.ts', barrelContent)

			const componentWithComments = `// This is a header comment
import React from 'react';
// Import UI components
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
// Other imports
import { api } from '@/lib/api';

/**
 * A component with comments
 */
export function ComponentWithComments() {
  return (
    <div>
      {/* Button comment */}
      <Button>Click</Button>
      <Input placeholder="Type here" />
    </div>
  );
}`

			await createTestFile(tempDir, 'src/components/Commented.tsx', componentWithComments)

			await config.set('barrelPaths', [join(tempDir, 'src/ui/index.ts')])
			await consolidator.initialize()

			const results = await consolidator.processFiles([join(tempDir, 'src')], false)

			expect(results.length).toBe(1)
			expect(results[0].changed).toBe(true)

			const modifiedContent = await fs.readFile(
				join(tempDir, 'src/components/Commented.tsx'),
				'utf-8'
			)

			expect(modifiedContent).toContain('// This is a header comment')
			expect(modifiedContent).toContain('/**')
			expect(modifiedContent).toContain('*/')
			expect(modifiedContent).toContain('{/* Button comment */}')
			expect(modifiedContent).toContain(
				"import { Button, Input } from '@/shared/components/ui';"
			)
			expect(modifiedContent).toContain("import { api } from '@/lib/api';")
		})
	})

	describe('edge cases', () => {
		test('should handle duplicate imports from same module', async () => {
			const barrelContent = `export { Button } from './button';`
			await createTestFile(tempDir, 'src/ui/index.ts', barrelContent)

			const duplicateImportsContent = `import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Button as AliasedButton } from '@/shared/components/ui/button';

export function DuplicateImportsComponent() {
  return (
    <div>
      <Button>Original</Button>
      <AliasedButton>Aliased</AliasedButton>
    </div>
  );
}`

			await createTestFile(tempDir, 'src/components/Duplicate.tsx', duplicateImportsContent)

			await config.set('barrelPaths', [join(tempDir, 'src/ui/index.ts')])
			await consolidator.initialize()

			const results = await consolidator.processFiles([join(tempDir, 'src')], false)

			expect(results.length).toBe(1)
		})
	})
})
