import Alidns20150109, * as $Alidns20150109 from '@alicloud/alidns20150109'
import * as $OpenApi from '@alicloud/openapi-client'
import * as $Util from '@alicloud/tea-util'
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
    const { hostname, ip, username: accessKeyId, password: accessKeySecret } = query

    let keyword = ''
    let domainName = ''
    const tmp = hostname.split('.')
    if (tmp.length < 2) {
      return 'badauth'
    }
    else if (tmp.length === 2) {
      keyword = '@'
      domainName = tmp.join('.')
    }
    else {
      keyword = tmp.slice(0, -2).join('.')
      domainName = tmp.slice(-2).join('.')
    }

    // Endpoint 请参考 https://api.aliyun.com/product/Alidns
    const endPoint = `dns.aliyuncs.com`
    const config = new $OpenApi.Config({
      accessKeyId,
      accessKeySecret,
    })
    config.endpoint = endPoint
    const client = new Alidns20150109(config)

    try {
      const describeDomainRecordsRequest = new $Alidns20150109.DescribeDomainRecordsRequest({
        domainName,
        typeKeyWord: 'A',
        RRKeyWord: keyword,
      })
      const runtime = new $Util.RuntimeOptions({ })
      const result = await client.describeDomainRecordsWithOptions(describeDomainRecordsRequest, runtime)
      if (!result.body.domainRecords.record.length) {
        const addDomainRecordRequest = new $Alidns20150109.AddDomainRecordRequest({
          domainName,
          RR: keyword,
          type: 'A',
          value: ip,
        })
        await client.addDomainRecordWithOptions(addDomainRecordRequest, runtime)
        return 'good'
      }
      else {
        const recordId = result.body.domainRecords.record[0].recordId
        const currentIP = result.body.domainRecords.record[0].value
        if (currentIP === ip) {
          return 'nochg'
        }
        const updateDomainRecordRequest = new $Alidns20150109.UpdateDomainRecordRequest({
          recordId,
          RR: keyword,
          type: 'A',
          value: ip,
        })
        await client.updateDomainRecordWithOptions(updateDomainRecordRequest, runtime)
        return 'good'
      }
    }
    catch (error) {
      this.logger.error(error.name)
      this.logger.error(error.message)
      this.logger.error(error.data.Recommend)
      return 'badauth'
    }
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
