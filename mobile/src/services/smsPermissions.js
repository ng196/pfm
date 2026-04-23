import { PermissionsAndroid, Platform } from "react-native";

export async function ensureSmsPermissions() {
  if (Platform.OS !== "android") {
    return { granted: false, reason: "SMS permissions are Android-only." };
  }

  const permissions = [
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ];

  const results = await PermissionsAndroid.requestMultiple(permissions);
  const granted = permissions.every((permission) => results[permission] === PermissionsAndroid.RESULTS.GRANTED);
  return {
    granted,
    results,
    reason: granted ? null : "SMS permissions were not granted.",
  };
}
