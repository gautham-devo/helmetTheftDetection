import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";

export default function IOSLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="home">
        <Icon sf="shield.fill" />
        <Label>Home</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="track">
        <Icon sf="map.fill" />
        <Label>Track</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <Icon sf="person.fill" />
        <Label>Account</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
