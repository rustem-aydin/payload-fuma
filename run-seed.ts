import { getPayload } from 'payload'
import configPromise from './src/payload.config'
import { seed } from './src/seed'

const run = async () => {
  const payload = await getPayload({ config: configPromise })
  await seed({ payload, req: {} as any })
  process.exit(0)
}
run()