import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { privateAgent, publicAgent } from '../../Requests/AuthRequests'
import { ShippingAPI, UserAPI } from '../../routes/Routes'
import MapPicker from '../MapPicker'

const DISTRICTS = [
  "Achham","Arghakhanchi","Baglung","Baitadi","Bajhang","Bajura","Banke","Bara","Bardiya","Bhaktapur","Bhojpur","Chitwan","Dadeldhura","Dailekh","Dang","Darchula","Dhading","Dhankuta","Dhanusha","Dolakha","Dolpa","Doti","Gorkha","Gulmi","Humla","Ilam","Jajarkot","Jhapa","Jumla","Kailali","Kalikot","Kanchanpur","Kapilvastu","Kaski","Kathmandu","Kavrepalanchok","Khotang","Lalitpur","Lamjung","Mahottari","Makwanpur","Manang","Morang","Mugu","Mustang","Myagdi","Nawalpur","Nuwakot","Okhaldhunga","Palpa","Panchthar","Parbat","Parsa","Pyuthan","Ramechhap","Rasuwa","Rautahat","Rolpa","Rukum East","Rukum West","Rupandehi","Salyan","Sankhuwasabha","Saptari","Sarlahi","Sindhuli","Sindhupalchok","Siraha","Solukhumbu","Sunsari","Surkhet","Syangja","Tanahun","Taplejung","Terhathum","Udayapur",
]

const ZONES = [
  "Bagmati","Gandaki","Karnali","Koshi","Lumbini","Madhesh","Sudurpashchim",
]

export default function SettingsTab() {
  const { user, signin } = useAuth()
  const [shopName, setShopName] = useState('')
  const [shopPhone, setShopPhone] = useState('')
  const [shopDistrict, setShopDistrict] = useState('')
  const [shopZone, setShopZone] = useState('')
  const [shopLat, setShopLat] = useState('')
  const [shopLng, setShopLng] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!user) return
    setShopName(user.shop_name || '')
    setShopPhone(user.phone || '')
    setShopDistrict(user.shop_district || '')
    setShopZone(user.shop_zone || '')
    setShopLat(user.shop_latitude != null ? String(user.shop_latitude) : '')
    setShopLng(user.shop_longitude != null ? String(user.shop_longitude) : '')
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const body = {
        shop_name: shopName || null,
        phone: shopPhone || null,
        shop_district: shopDistrict || null,
        shop_zone: shopZone || null,
        shop_latitude: shopLat ? parseFloat(shopLat) : null,
        shop_longitude: shopLng ? parseFloat(shopLng) : null,
      }
      await privateAgent.put(UserAPI({}).updateMe, body)
      setMsg('Settings saved!')
    } catch {
      setMsg('Failed to save.')
    }
    setSaving(false)
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">Update your shop information, location, and contact details.</p>

      <div className="bg-white rounded-2xl p-6 max-w-xl space-y-4">
        <div>
          <label className="text-xs text-muted block mb-1">Shop Name</label>
          <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">Phone Number</label>
          <input type="tel" value={shopPhone} onChange={e => setShopPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">District</label>
            <select value={shopDistrict} onChange={e => setShopDistrict(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="">Select district</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted block mb-1">Zone / Province</label>
            <select value={shopZone} onChange={e => setShopZone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option value="">Select zone</option>
              {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted block mb-1">Shop Location (latitude, longitude)</label>
          <div className="flex gap-2">
            <input type="text" placeholder="Latitude" value={shopLat} onChange={e => setShopLat(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <input type="text" placeholder="Longitude" value={shopLng} onChange={e => setShopLng(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-cream text-dark text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
            <button onClick={() => setShowMap(true)}
              className="px-4 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition whitespace-nowrap">Pick on Map</button>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>

        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </div>

      {showMap && (
        <MapPicker
          lat={shopLat}
          lng={shopLng}
          onConfirm={(lat, lng) => {
            setShopLat(lat.toFixed(6))
            setShopLng(lng.toFixed(6))
            setShowMap(false)
          }}
          onClose={() => setShowMap(false)}
        />
      )}
    </div>
  )
}
