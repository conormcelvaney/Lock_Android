<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>Lock Asset Manager</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="auth.currentUser" text @click="logout">Logout</v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { auth } from './firebase'
import { signOut } from 'firebase/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const logout = async () => {
  await signOut(auth)
  router.push('/login')
}
</script>

<style>
body {
  margin: 0;
  font-family: Roboto, sans-serif;
}
</style>
