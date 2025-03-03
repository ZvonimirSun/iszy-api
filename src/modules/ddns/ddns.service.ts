import { Injectable, Logger } from '@nestjs/common'
import axios from 'axios'
import { DDNSUpdateDto } from './dto/ddns_update.dto'

@Injectable()
export class DDNSService {
  private readonly logger = new Logger(DDNSService.name)

  async update(provider: string, query: DDNSUpdateDto): Promise<string> {
    switch (provider) {
      case 'ali':
        return this.updateAli(query)
      case 'cloudflare':
        return this.updateCloudflare(query)
      default:
        break
    }
  }

  async updateAli(query: DDNSUpdateDto) {
    return 'test'
  }

  async updateCloudflare(query: DDNSUpdateDto) {
    const { hostname, ip, username: zone, password: key } = query
    const cloudflareAPI = 'https://api.cloudflare.com/client/v4'
    try {
      const res = await axios.get(`${cloudflareAPI}/zones/${zone}/dns_records?type=A&name=${hostname}`, {
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      })
      const recordId: string | null = ((res.data.result ?? [])[0] ?? {}).id ?? null
      const currentIP: string | '' = ((res.data.result ?? [])[0] ?? {}).content ?? ''
      if (currentIP === ip)
        return 'nochg'

      const dataToSend = {
        type: 'A',
        name: hostname,
        content: ip,
        ttl: 1,
        proxied: false,
      }

      if (recordId == null) {
        const creationResponse = await axios.post(
          `${cloudflareAPI}/zones/${zone}/dns_records`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          },
        )
        if (creationResponse.data.success === false)
          return 'badauth'
        return 'good'
      }
      else {
        const updateResponse = await axios.put(
          `${cloudflareAPI}/zones/${zone}/dns_records/${recordId}`,
          dataToSend,
          {
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
          },
        )
        if (updateResponse.data.success === false)
          return 'badauth'
        return 'good'
      }
    }
    catch (e) {
      this.logger.error(e.response.data)
      return 'badauth'
    }
  }
}
