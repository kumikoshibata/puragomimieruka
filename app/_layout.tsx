import Stack from "expo-router/stack";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: "#fff7df" },
        contentStyle: { backgroundColor: "#fff7df" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "なごやピカピカマップ",
        }}
      />
    </Stack>
  );
}
