import axios from 'axios'
const axiosIns = axios.create({
  withCredentials: true
})

export const QueryResult = async function(params) {
  return axiosIns({
    url: '/api/v1/order/findOrder',
    method: 'get',
    params,
  }).then(res => res.data)
}