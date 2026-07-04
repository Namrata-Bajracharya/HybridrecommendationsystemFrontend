import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { privateAgent } from "../Requests/AuthRequests";
import { UserAPI } from "../routes/Routes";
import { useSnackbar } from "notistack";
import MapPicker from "../components/MapPicker";

const DISTRICTS = [
  "Achham","Arghakhanchi","Baglung","Baitadi","Bajhang","Bajura","Banke","Bara","Bardiya","Bhaktapur","Bhojpur","Chitwan","Dadeldhura","Dailekh","Dang","Darchula","Dhading","Dhankuta","Dhanusha","Dolakha","Dolpa","Doti","Gorkha","Gulmi","Humla","Ilam","Jajarkot","Jhapa","Jumla","Kailali","Kalikot","Kanchanpur","Kapilvastu","Kaski","Kathmandu","Kavrepalanchok","Khotang","Lalitpur","Lamjung","Mahottari","Makwanpur","Manang","Morang","Mugu","Mustang","Myagdi","Nawalpur","Nuwakot","Okhaldhunga","Palpa","Panchthar","Parbat","Parsa","Pyuthan","Ramechhap","Rasuwa","Rautahat","Rolpa","Rukum East","Rukum West","Rupandehi","Salyan","Sankhuwasabha","Saptari","Sarlahi","Sindhuli","Sindhupalchok","Siraha","Solukhumbu","Sunsari","Surkhet","Syangja","Tanahun","Taplejung","Terhathum","Udayapur",
]

const ZONES = [
  "Bagmati","Gandaki","Karnali","Koshi","Lumbini","Madhesh","Sudurpashchim",
]

const emptyAddr = () => ({
  label: "",
  phone: "",
  samePhone: true,
  street: "",
  landmark: "",
  city: "",
  state: "",
  postal_code: "",
  latitude: "",
  longitude: "",
});

const LABELS = ["home", "office", "other"];

export default function ProfileComplete() {
  const { user, signout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname === "/profile/edit" || !!user?.first_name;
  const isAdmin = user?.role === "admin";
  const { enqueueSnackbar } = useSnackbar();

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState([emptyAddr()]);
  const [loading, setLoading] = useState(false);
  const [mapPickerIndex, setMapPickerIndex] = useState(null);

  // admin shop fields
  const [shopName, setShopName] = useState("");
  const [shopDistrict, setShopDistrict] = useState("");
  const [shopZone, setShopZone] = useState("");
  const [shopLat, setShopLat] = useState("");
  const [shopLng, setShopLng] = useState("");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setPhone(user.phone || "");
    if (isAdmin) {
      setShopName(user.shop_name || "");
      setShopDistrict(user.shop_district || "");
      setShopZone(user.shop_zone || "");
      setShopLat(user.shop_latitude != null ? String(user.shop_latitude) : "");
      setShopLng(user.shop_longitude != null ? String(user.shop_longitude) : "");
    } else if (isEdit) {
      privateAgent.get(UserAPI({}).getAddresses)
        .then((res) => {
          const addrs = res.data;
          if (addrs.length > 0) {
            setAddresses(addrs.map((a) => ({
              label: a.label || "",
              phone: a.phone || "",
              street: a.street || "",
              landmark: a.landmark || "",
              city: a.city || "",
              state: a.state || "",
              postal_code: a.postal_code || "",
              latitude: a.latitude ?? "",
              longitude: a.longitude ?? "",
            })));
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const updateAddr = (i, field, value) => {
    const next = [...addresses];
    next[i] = { ...next[i], [field]: value };
    setAddresses(next);
  };

  const addAddr = () => setAddresses([...addresses, emptyAddr()]);
  const removeAddr = (i) => {
    if (addresses.length <= 1) return;
    setAddresses(addresses.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!first_name.trim()) { enqueueSnackbar("First name is required", { variant: "warning" }); return; }
    if (!phone.trim()) { enqueueSnackbar("Phone number is required", { variant: "warning" }); return; }
    setLoading(true);
    try {
      const body = {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone.trim(),
      };

      if (isAdmin) {
        body.shop_name = shopName.trim() || null;
        body.shop_district = shopDistrict || null;
        body.shop_zone = shopZone || null;
        body.shop_latitude = shopLat ? parseFloat(shopLat) : null;
        body.shop_longitude = shopLng ? parseFloat(shopLng) : null;
      }

      const resp = await privateAgent.put(UserAPI({}).updateMe, body);
      const updated = resp.data;
      localStorage.setItem("kalleenepal_session", JSON.stringify(updated));

      if (!isAdmin) {
        const validAddrs = addresses.filter((a) => a.street.trim() || a.city.trim() || a.landmark.trim());
        for (const a of validAddrs) {
          if (!a.street.trim()) { enqueueSnackbar("Street/Area is required for each address", { variant: "warning" }); setLoading(false); return; }
          if (!a.city.trim()) { enqueueSnackbar("City is required for each address", { variant: "warning" }); setLoading(false); return; }
          if (!a.landmark.trim()) { enqueueSnackbar("Landmark is required for each address", { variant: "warning" }); setLoading(false); return; }
        }
        for (let idx = 0; idx < validAddrs.length; idx++) {
          const a = validAddrs[idx];
          const addrPhone = idx === 0 ? phone.trim() : (a.samePhone ? phone.trim() : a.phone.trim());
          await privateAgent.post(UserAPI({}).addAddress, {
            type: "delivery",
            label: a.label || "other",
            phone: addrPhone,
            street: a.street.trim(),
            landmark: a.landmark.trim(),
            city: a.city.trim(),
            state: a.state.trim(),
            postal_code: a.postal_code.trim(),
            country: "Nepal",
            latitude: a.latitude ? parseFloat(a.latitude) : null,
            longitude: a.longitude ? parseFloat(a.longitude) : null,
            is_default: false,
          });
        }
      }

      enqueueSnackbar("Profile saved!", { variant: "success" });
      if (isAdmin) window.location.href = "/admin/dashboard";
      else window.location.href = `/${user.id}/dashboard`;
    } catch (err) {
      enqueueSnackbar(err?.response?.data?.detail || "Failed to save profile", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2 rounded-xl bg-cream text-sm";

  return (
    <div className="max-w-lg mx-auto py-20">
      <h1 className="text-2xl font-semibold mb-1">{isEdit ? "Update Profile" : "Complete Your Profile"}</h1>
      <p className="text-sm text-muted mb-6">{isEdit ? "Edit your profile details below." : "Fill in your details to get started."}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input placeholder="First name *" value={first_name} onChange={e => setFirstName(e.target.value)} className={inputClass} />
        <input placeholder="Last name" value={last_name} onChange={e => setLastName(e.target.value)} className={inputClass} />
        <input placeholder="Phone *" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />

        <hr className="border-cream-alt" />

        {isAdmin ? (
          <>
            <p className="text-xs text-muted/60 uppercase tracking-wide">Shop Details</p>
            <input placeholder="Shop name" value={shopName} onChange={e => setShopName(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-3">
              <select value={shopDistrict} onChange={e => setShopDistrict(e.target.value)} className={inputClass}>
                <option value="">District</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={shopZone} onChange={e => setShopZone(e.target.value)} className={inputClass}>
                <option value="">Zone</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Latitude" type="number" step="any" value={shopLat} onChange={e => setShopLat(e.target.value)} className={inputClass} />
              <input placeholder="Longitude" type="number" step="any" value={shopLng} onChange={e => setShopLng(e.target.value)} className={inputClass} />
            </div>
            <button type="button" onClick={() => setMapPickerIndex(-1)}
              className="text-xs text-accent hover:underline mb-2">Pick on map</button>
          </>
        ) : (
          <>
            <p className="text-xs text-muted/60 uppercase tracking-wide">Delivery Addresses</p>

            {addresses.map((addr, i) => (
              <div key={i} className="space-y-2 p-4 rounded-xl border border-cream-alt relative">
                {addresses.length > 1 && (
                  <button type="button" onClick={() => removeAddr(i)}
                    className="absolute top-2 right-2 text-xs text-red-400 hover:text-red-600">&times; Remove</button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <select value={addr.label} onChange={(e) => updateAddr(i, "label", e.target.value)}
                    className={inputClass}>
                    <option value="">Label</option>
                    {LABELS.map((l) => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                  {i === 0 ? (
                    <p className="text-xs text-muted self-center">Phone: {phone || "(use main phone)"}</p>
                  ) : (
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-xs text-muted">
                        <input type="checkbox" checked={addr.samePhone} onChange={(e) => updateAddr(i, "samePhone", e.target.checked)} />
                        Same as above ({phone || "main"})
                      </label>
                      {!addr.samePhone && (
                        <input placeholder="Phone for this address" type="tel" value={addr.phone}
                          onChange={(e) => updateAddr(i, "phone", e.target.value)} className="w-full px-4 py-2 rounded-xl bg-cream text-sm" />
                      )}
                    </div>
                  )}
                </div>
                <input placeholder="Street / Area" value={addr.street}
                  onChange={(e) => updateAddr(i, "street", e.target.value)} className={inputClass} />
                <input placeholder="Nearby landmark" value={addr.landmark}
                  onChange={(e) => updateAddr(i, "landmark", e.target.value)} className={inputClass} />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="City" value={addr.city} onChange={(e) => updateAddr(i, "city", e.target.value)} className={inputClass} />
                  <input placeholder="State" value={addr.state} onChange={(e) => updateAddr(i, "state", e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="Postal code" value={addr.postal_code}
                    onChange={(e) => updateAddr(i, "postal_code", e.target.value)} className={inputClass} />
                  <input placeholder="Latitude" type="number" step="any" value={addr.latitude}
                    onChange={(e) => updateAddr(i, "latitude", e.target.value)} className={inputClass} />
                  <input placeholder="Longitude" type="number" step="any" value={addr.longitude}
                    onChange={(e) => updateAddr(i, "longitude", e.target.value)} className={inputClass} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMapPickerIndex(i)}
                    className="text-xs text-accent hover:underline">Pick on map</button>
                  {addr.latitude && addr.longitude && (
                    <a href={`https://www.openstreetmap.org/?mlat=${addr.latitude}&mlon=${addr.longitude}#map=15/${addr.latitude}/${addr.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline">View on map</a>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addAddr}
              className="w-full px-4 py-2 rounded-xl border-2 border-dashed border-cream-alt text-sm text-muted hover:text-dark hover:border-dark transition">
              + Add another address
            </button>
          </>
        )}

        <button type="submit" disabled={loading}
          className="w-full px-6 py-2 rounded-xl bg-dark text-cream text-sm font-medium hover:opacity-90 transition disabled:opacity-40">
          {loading ? "Saving..." : "Save & Continue"}
        </button>
      </form>

      <div className="flex justify-center gap-4 mt-6">
        {isEdit ? (
          <>
            <button onClick={() => navigate("/change-password")} className="text-xs text-muted hover:text-dark underline">Change password</button>
            <button onClick={signout} className="text-xs text-muted hover:text-dark underline">Logout</button>
          </>
        ) : (
          <button onClick={signout} className="text-xs text-muted hover:text-dark underline">Not now, logout</button>
        )}
      </div>

      {mapPickerIndex !== null && (
        <MapPicker
          lat={mapPickerIndex === -1 ? shopLat : addresses[mapPickerIndex]?.latitude}
          lng={mapPickerIndex === -1 ? shopLng : addresses[mapPickerIndex]?.longitude}
          onConfirm={(lat, lng) => {
            if (mapPickerIndex === -1) {
              setShopLat(lat.toFixed(6));
              setShopLng(lng.toFixed(6));
            } else {
              setAddresses((prev) => {
                const next = [...prev];
                next[mapPickerIndex] = { ...next[mapPickerIndex], latitude: lat.toString(), longitude: lng.toString() };
                return next;
              });
            }
            setMapPickerIndex(null);
          }}
          onClose={() => setMapPickerIndex(null)}
        />
      )}
    </div>
  );
}
