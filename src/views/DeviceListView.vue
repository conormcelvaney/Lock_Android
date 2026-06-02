<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h2 class="mb-4">Active Lock Devices</h2>
        <v-list>
          <v-list-item
            v-for="device in activeDevices"
            :key="device.id"
            :to="`/device/${device.id}`"
            class="mb-2 elevation-2"
          >
            <v-list-item-title class="font-weight-bold">{{ device.id }}</v-list-item-title>
            <v-list-item-subtitle>
              Last Sync: {{ formatTime(device.lastsync) }}<br/>
              FW: {{ device.firmwareVersion || 'Unknown' }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-icon color="primary">mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>
        <v-alert v-if="activeDevices.length === 0 && !loading" type="info">
          No active devices found in the last 5 minutes.
        </v-alert>
        <div v-if="loading" class="text-center mt-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

const activeDevices = ref([])
const loading = ref(true)
let unsubscribe = null

onMounted(() => {
  // Query for devices active in the last 5 minutes
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000)
  
  const q = query(
    collection(db, 'datastore/assetlock/devices'),
    where('lastsync', '>=', fiveMinsAgo)
  )

  unsubscribe = onSnapshot(q, (snapshot) => {
    activeDevices.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    loading.value = false
  }, (err) => {
    console.error("Error fetching devices:", err)
    loading.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})

const formatTime = (timestamp) => {
  if (!timestamp) return 'Never'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString()
}
</script>
