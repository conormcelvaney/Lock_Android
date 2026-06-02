<template>
  <v-container>
    <v-btn icon="mdi-arrow-left" variant="text" @click="router.back()" class="mb-2"></v-btn>
    <h2 class="mb-4">Device: {{ id }}</h2>

    <v-alert v-if="deviceError" type="error" class="mb-4">{{ deviceError }}</v-alert>

    <v-card class="mb-4">
      <v-card-text>
        <div class="d-flex align-center justify-space-between mb-2">
          <span><strong>BLE Status:</strong> {{ bleStatus }}</span>
          <v-btn 
            :color="isConnected ? 'error' : 'success'" 
            @click="isConnected ? disconnect() : connect()"
            :loading="isConnecting"
          >
            {{ isConnected ? 'Disconnect' : 'Connect' }}
          </v-btn>
        </div>
        <div v-if="deviceData">
          <p><strong>Cloud FW:</strong> {{ deviceData.firmwareVersion }}</p>
          <p><strong>Last Sync:</strong> {{ formatTime(deviceData.lastsync) }}</p>
          <p v-if="!deviceData.blePin" class="text-error mt-2">
            Warning: No BLE PIN found in cloud data. Ensure device has synced.
          </p>
        </div>
      </v-card-text>
    </v-card>

    <v-tabs v-model="tab" color="primary" v-if="isConnected">
      <v-tab value="logs">Logs</v-tab>
      <v-tab value="whitelist">Whitelist</v-tab>
      <v-tab value="wifi">WiFi</v-tab>
    </v-tabs>

    <v-window v-model="tab" v-if="isConnected" class="mt-4">
      <v-window-item value="logs">
        <v-card>
          <v-card-text class="bg-grey-darken-4 text-pre" style="height: 300px; overflow-y: auto; font-family: monospace;" id="logs-container">
            <div v-for="(log, idx) in logs" :key="idx">{{ log }}</div>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="whitelist">
        <v-card>
          <v-card-text>
            <v-textarea v-model="whitelistData" label="Whitelist Data (UID|UID|)" rows="5"></v-textarea>
            <v-btn color="primary" @click="saveWhitelist" class="mt-2">Save Whitelist to Device</v-btn>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="wifi">
        <v-card>
          <v-card-text>
            <p class="mb-2"><strong>Current SSID:</strong> {{ currentWifiSsid }}</p>
            <v-text-field v-model="newSsid" label="New SSID"></v-text-field>
            <v-text-field v-model="newPassword" label="New Password"></v-text-field>
            <v-btn color="primary" @click="saveWifi" class="mt-2" :disabled="!newSsid || !newPassword">
              Save WiFi & Reboot Device
            </v-btn>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'
import { BleClient, textToDataView, dataViewToText } from '@capacitor-community/bluetooth-le'

const router = useRouter()
const route = useRoute()
const id = route.params.id

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
const AUTH_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"
const LOGS_CHAR_UUID = "beb5483f-36e1-4688-b7f5-ea07361b26a8"
const WHITELIST_CHAR_UUID = "beb54840-36e1-4688-b7f5-ea07361b26a8"
const WIFI_CHAR_UUID = "beb54841-36e1-4688-b7f5-ea07361b26a8"

const deviceData = ref(null)
const deviceError = ref(null)
const bleStatus = ref('Disconnected')
const isConnected = ref(false)
const isConnecting = ref(false)
const bleDeviceId = ref(null)

const tab = ref('logs')
const logs = ref([])

const whitelistData = ref('')
const currentWifiSsid = ref('')
const newSsid = ref('')
const newPassword = ref('')

onMounted(async () => {
  await fetchDeviceData()
  try {
    await BleClient.initialize({ androidNeverForLocation: true })
  } catch (err) {
    console.error("BLE Init Error", err)
  }
})

onUnmounted(async () => {
  if (isConnected.value) {
    await disconnect()
  }
})

const fetchDeviceData = async () => {
  try {
    const docRef = doc(db, 'datastore/assetlock/devices', id)
    const snap = await getDoc(docRef)
    if (snap.exists()) {
      deviceData.value = snap.data()
    } else {
      deviceError.value = "Device not found in cloud."
    }
  } catch (err) {
    deviceError.value = "Error fetching device data: " + err.message
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'Never'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}

const connect = async () => {
  if (!deviceData.value || !deviceData.value.blePin) {
    deviceError.value = "Cannot connect: No BLE PIN available. Ensure the device has synced with the cloud."
    return
  }

  isConnecting.value = true
  deviceError.value = null
  bleStatus.value = 'Scanning...'
  
  // Format device name from MAC address, e.g. "LockAsset_123456"
  const macSuffix = id.replace(/:/g, '').substring(6)
  const targetName = "LockAsset_" + macSuffix

  try {
    const device = await BleClient.requestDevice({
      services: [SERVICE_UUID],
      // namePrefix: targetName
    })
    
    bleDeviceId.value = device.deviceId
    bleStatus.value = 'Connecting...'
    
    await BleClient.connect(bleDeviceId.value, (id) => onDisconnect(id))
    
    // Auth
    bleStatus.value = 'Authenticating...'
    await BleClient.write(bleDeviceId.value, SERVICE_UUID, AUTH_CHAR_UUID, textToDataView(deviceData.value.blePin))
    
    // Wait a moment for auth to process
    await new Promise(r => setTimeout(r, 500))
    
    isConnected.value = true
    bleStatus.value = 'Connected & Authenticated'
    
    await loadInitialData()
    await startLogStream()

  } catch (err) {
    console.error("Connect error", err)
    deviceError.value = "Connection failed: " + err.message
    bleStatus.value = 'Disconnected'
  } finally {
    isConnecting.value = false
  }
}

const disconnect = async () => {
  if (bleDeviceId.value) {
    try {
      await BleClient.disconnect(bleDeviceId.value)
    } catch(e) {}
  }
  onDisconnect()
}

const onDisconnect = () => {
  isConnected.value = false
  bleStatus.value = 'Disconnected'
  bleDeviceId.value = null
}

const loadInitialData = async () => {
  try {
    const wlView = await BleClient.read(bleDeviceId.value, SERVICE_UUID, WHITELIST_CHAR_UUID)
    whitelistData.value = dataViewToText(wlView)

    const wifiView = await BleClient.read(bleDeviceId.value, SERVICE_UUID, WIFI_CHAR_UUID)
    currentWifiSsid.value = dataViewToText(wifiView)
  } catch(e) {
    console.error("Error loading initial data", e)
  }
}

const startLogStream = async () => {
  try {
    await BleClient.startNotifications(
      bleDeviceId.value,
      SERVICE_UUID,
      LOGS_CHAR_UUID,
      (value) => {
        const text = dataViewToText(value)
        logs.value.push(text)
        if (logs.value.length > 200) {
          logs.value.shift()
        }
        nextTick(() => {
          const container = document.getElementById('logs-container')
          if (container) container.scrollTop = container.scrollHeight
        })
      }
    )
  } catch(e) {
    console.error("Error starting log stream", e)
  }
}

const saveWhitelist = async () => {
  try {
    await BleClient.write(bleDeviceId.value, SERVICE_UUID, WHITELIST_CHAR_UUID, textToDataView(whitelistData.value))
    alert("Whitelist saved to device!")
  } catch (err) {
    alert("Error saving whitelist: " + err.message)
  }
}

const saveWifi = async () => {
  try {
    const payload = `${newSsid.value}|${newPassword.value}`
    await BleClient.write(bleDeviceId.value, SERVICE_UUID, WIFI_CHAR_UUID, textToDataView(payload))
    alert("WiFi credentials sent. Device is rebooting.")
    await disconnect()
  } catch (err) {
    alert("Error saving WiFi: " + err.message)
  }
}
</script>

<style scoped>
.text-pre {
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
