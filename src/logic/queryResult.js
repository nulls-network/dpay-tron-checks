import axios from 'axios'
const axiosIns = axios.create({
  withCredentials: true
})

export const QueryResult = async function(uuid) {
  return axiosIns({
    url: `/api/v1/order/${uuid}`,
    method: 'get',
  }).then(res => res.data)
}

export const QueryResult1 = async function(uuid) {
  return axiosIns({
    url: `/api/v2/order/${uuid}`,
    method: 'get',
  }).then(res => res.data)
}