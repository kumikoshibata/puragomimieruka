import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

type MascotKind =
  | "shachihoko"
  | "chick"
  | "gorilla"
  | "flower"
  | "leaf"
  | "castle"
  | "star";

type Ward = {
  id: string;
  name: string;
  clearRate: number;
  posts: number;
  mascot: MascotKind;
  color: string;
};

type ProgressBar = {
  id: string;
  label: string;
  start: number;
  target: number;
  color: string;
};

type WardPlacement = {
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  rotate: string;
};

const APP_CONFIG = {
  postToClearRatio: 0.55,
  burstCountForLargeButton: 8,
  progressBars: [
    {
      id: "containers",
      label: "プラスチック製容器包装の分別率",
      start: 47,
      target: 60,
      color: "#75c99a",
    },
    {
      id: "products",
      label: "プラスチック製品の分別率",
      start: 27,
      target: 30,
      color: "#9ed8f2",
    },
  ] satisfies ProgressBar[],
  wards: [
    { id: "chikusa", name: "千種区", clearRate: 0, posts: 0, mascot: "leaf", color: "#bcebd1" },
    { id: "higashi", name: "東区", clearRate: 0, posts: 0, mascot: "castle", color: "#f9d7a8" },
    { id: "kita", name: "北区", clearRate: 0, posts: 0, mascot: "flower", color: "#ffd3df" },
    { id: "nishi", name: "西区", clearRate: 0, posts: 0, mascot: "star", color: "#ffe486" },
    { id: "nakamura", name: "中村区", clearRate: 0, posts: 0, mascot: "shachihoko", color: "#ffc979" },
    { id: "naka", name: "中区", clearRate: 0, posts: 0, mascot: "castle", color: "#a8dbf1" },
    { id: "showa", name: "昭和区", clearRate: 0, posts: 0, mascot: "chick", color: "#ffe18b" },
    { id: "mizuho", name: "瑞穂区", clearRate: 0, posts: 0, mascot: "flower", color: "#ffc1ca" },
    { id: "atsuta", name: "熱田区", clearRate: 0, posts: 0, mascot: "shachihoko", color: "#ffd071" },
    { id: "nakagawa", name: "中川区", clearRate: 0, posts: 0, mascot: "leaf", color: "#a9e5bd" },
    { id: "minato", name: "港区", clearRate: 0, posts: 0, mascot: "star", color: "#9fdcf4" },
    { id: "minami", name: "南区", clearRate: 0, posts: 0, mascot: "flower", color: "#ffb9c8" },
    { id: "moriyama", name: "守山区", clearRate: 0, posts: 0, mascot: "gorilla", color: "#c8e7a6" },
    { id: "midori", name: "緑区", clearRate: 0, posts: 0, mascot: "leaf", color: "#8bd79f" },
    { id: "meito", name: "名東区", clearRate: 0, posts: 0, mascot: "chick", color: "#fff0a1" },
    { id: "tempaku", name: "天白区", clearRate: 0, posts: 0, mascot: "flower", color: "#cdb8ff" },
  ] satisfies Ward[],
};

const WARD_LAYOUT: Record<string, WardPlacement> = {
  moriyama: { x: 50, y: 2, w: 25, h: 15, radius: 22, rotate: "3deg" },
  kita: { x: 31, y: 8, w: 22, h: 14, radius: 20, rotate: "-4deg" },
  nishi: { x: 13, y: 16, w: 23, h: 15, radius: 22, rotate: "3deg" },
  higashi: { x: 48, y: 18, w: 20, h: 13, radius: 18, rotate: "-2deg" },
  chikusa: { x: 66, y: 18, w: 22, h: 15, radius: 20, rotate: "3deg" },
  meito: { x: 75, y: 33, w: 20, h: 14, radius: 20, rotate: "-5deg" },
  nakamura: { x: 12, y: 33, w: 25, h: 15, radius: 24, rotate: "-3deg" },
  naka: { x: 38, y: 33, w: 21, h: 15, radius: 18, rotate: "2deg" },
  showa: { x: 59, y: 35, w: 19, h: 14, radius: 18, rotate: "-3deg" },
  nakagawa: { x: 3, y: 50, w: 28, h: 18, radius: 26, rotate: "2deg" },
  atsuta: { x: 32, y: 50, w: 21, h: 14, radius: 18, rotate: "-2deg" },
  mizuho: { x: 54, y: 50, w: 20, h: 14, radius: 18, rotate: "3deg" },
  tempaku: { x: 72, y: 51, w: 23, h: 16, radius: 24, rotate: "-2deg" },
  minato: { x: 0, y: 69, w: 34, h: 24, radius: 30, rotate: "-3deg" },
  minami: { x: 35, y: 68, w: 24, h: 17, radius: 22, rotate: "2deg" },
  midori: { x: 58, y: 69, w: 34, h: 22, radius: 30, rotate: "3deg" },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getMessage(ward: Ward) {
  if (ward.clearRate >= 100) return "ピカピカ達成。名物アイコンが見えるようになりました。";
  if (ward.clearRate >= 70) return "あと少し。街の色と緑がかなり見えてきました。";
  if (ward.clearRate >= 35) return "モザイクの向こうに、楽しい街並みが見えはじめています。";
  if (ward.clearRate > 0) return "小さな分別が集まって、すこし明るくなりました。";
  return "まだ霧の中。最初の分別投稿を待っています。";
}

function formatNumber(value: number) {
  return value.toLocaleString("ja-JP");
}

export default function PikapikaMapScreen() {
  const { width } = useWindowDimensions();
  const [wards, setWards] = useState<Ward[]>(() =>
    APP_CONFIG.wards.map((ward) => ({ ...ward })),
  );
  const [selectedWardId, setSelectedWardId] = useState(APP_CONFIG.wards[0].id);
  const [sparkWardIds, setSparkWardIds] = useState<string[]>([]);
  const [celebrated, setCelebrated] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiSeed, setConfettiSeed] = useState(0);

  const mapSize = Math.min(width - 44, 420);
  const mapHeight = mapSize * 1.18;

  const averageClearRate = useMemo(() => {
    const total = wards.reduce((sum, ward) => sum + ward.clearRate, 0);
    return Math.round(total / wards.length);
  }, [wards]);

  const completeCount = useMemo(
    () => wards.filter((ward) => ward.clearRate >= 100).length,
    [wards],
  );

  const selectedWard = wards.find((ward) => ward.id === selectedWardId) ?? wards[0];

  useEffect(() => {
    if (!celebrated && completeCount === wards.length) {
      setCelebrated(true);
      setShowCelebration(true);
      setConfettiSeed((seed) => seed + 1);
    }
  }, [celebrated, completeCount, wards.length]);

  function sparkleWard(id: string) {
    setSparkWardIds((ids) => [...ids.filter((item) => item !== id), id]);
    setTimeout(() => {
      setSparkWardIds((ids) => ids.filter((item) => item !== id));
    }, 720);
  }

  function chooseRandomWard(list: Ward[]) {
    const unfinished = list.filter((ward) => ward.clearRate < 100);
    const pool = unfinished.length > 0 ? unfinished : list;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function addPosts(amount: number) {
    setWards((current) => {
      const next = current.map((ward) => ({ ...ward }));
      const bursts = amount >= 100 ? APP_CONFIG.burstCountForLargeButton : 1;
      const postsPerBurst = Math.round(amount / bursts);
      let lastWardId = selectedWardId;

      for (let index = 0; index < bursts; index += 1) {
        const ward = chooseRandomWard(next);
        const bonus = amount >= 100
          ? 4 + Math.floor(Math.random() * 7)
          : 5 + Math.floor(Math.random() * 8);
        const clearGain = Math.max(
          1,
          Math.round(postsPerBurst * APP_CONFIG.postToClearRatio + bonus),
        );
        ward.posts += postsPerBurst;
        ward.clearRate = clamp(ward.clearRate + clearGain, 0, 100);
        lastWardId = ward.id;
        setTimeout(() => sparkleWard(ward.id), index * 70);
      }

      setSelectedWardId(lastWardId);
      return next;
    });
  }

  function resetDemo() {
    setWards(APP_CONFIG.wards.map((ward) => ({ ...ward })));
    setSelectedWardId(APP_CONFIG.wards[0].id);
    setSparkWardIds([]);
    setCelebrated(false);
    setShowCelebration(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff7df" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          alignItems: "center",
          gap: 14,
          paddingHorizontal: 14,
          paddingBottom: 30,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 480,
            gap: 14,
            paddingTop: 6,
          }}
        >
          <Header averageClearRate={averageClearRate} />

          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.74)",
              borderColor: "rgba(255,255,255,0.86)",
              borderWidth: 2,
              borderRadius: 30,
              borderCurve: "continuous",
              padding: 13,
              gap: 10,
              boxShadow: "0 14px 30px rgba(154,112,56,0.16)",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Text selectable style={{ color: "#4d4031", fontSize: 16, fontWeight: "900" }}>
                名古屋の晴れ度 <Text style={{ color: "#e88c4c" }}>{averageClearRate}%</Text>
              </Text>
              <Text selectable style={{ color: "#7b6b57", fontSize: 12, fontWeight: "800" }}>
                {completeCount} / {wards.length}区 ピカピカ
              </Text>
            </View>

            <View
              style={{
                alignSelf: "center",
                width: mapSize,
                height: mapHeight,
                backgroundColor: "#d8f1d2",
                borderRadius: 36,
                borderCurve: "continuous",
                borderColor: "rgba(255,255,255,0.88)",
                borderWidth: 3,
                overflow: "hidden",
                position: "relative",
              }}
            >
              <NagoyaMapBackdrop />
              {wards.map((ward) => {
                const placement = WARD_LAYOUT[ward.id];
                return (
                  <WardTile
                    key={ward.id}
                    ward={ward}
                    width={(mapSize * placement.w) / 100}
                    height={(mapHeight * placement.h) / 100}
                    placement={{
                      left: (mapSize * placement.x) / 100,
                      top: (mapHeight * placement.y) / 100,
                      radius: placement.radius,
                      rotate: placement.rotate,
                    }}
                    selected={ward.id === selectedWardId}
                    sparkling={sparkWardIds.includes(ward.id)}
                    onPress={() => {
                      setSelectedWardId(ward.id);
                      sparkleWard(ward.id);
                    }}
                  />
                );
              })}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: "5%",
                  right: "7%",
                  bottom: "3%",
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: "rgba(101,154,116,0.24)",
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  right: "3%",
                  bottom: "4%",
                  width: "18%",
                  height: "17%",
                  borderTopLeftRadius: 26,
                  backgroundColor: "rgba(135,210,238,0.45)",
                }}
                />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10 }}>
            <ActionButton label="+10件の分別" onPress={() => addPosts(10)} />
            <ActionButton label="+100件の分別" onPress={() => addPosts(100)} />
          </View>

          <Pressable
            onPress={resetDemo}
            style={({ pressed }) => ({
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 18,
              borderCurve: "continuous",
              backgroundColor: pressed ? "#bcebd1" : "#d7f4e0",
              transform: [{ translateY: pressed ? 3 : 0 }],
            })}
          >
            <Text style={{ color: "#50391f", fontSize: 14, fontWeight: "900" }}>
              リセット
            </Text>
          </Pressable>

          <DetailPanel ward={selectedWard} />
        </View>
      </ScrollView>

      {showCelebration ? (
        <CelebrationOverlay
          seed={confettiSeed}
          onClose={() => setShowCelebration(false)}
        />
      ) : null}
    </View>
  );
}

function Header({ averageClearRate }: { averageClearRate: number }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.72)",
        borderColor: "rgba(255,255,255,0.9)",
        borderWidth: 2,
        borderRadius: 28,
        borderCurve: "continuous",
        padding: 16,
        gap: 12,
        boxShadow: "0 14px 30px rgba(154,112,56,0.16)",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <ChickLogo />
        <View style={{ flex: 1 }}>
          <Text selectable style={{ color: "#4d4031", fontSize: 30, fontWeight: "900", lineHeight: 34 }}>
            なごやピカピカマップ
          </Text>
        </View>
      </View>
      <Text selectable style={{ color: "#7b6b57", fontSize: 14, fontWeight: "700", lineHeight: 22 }}>
        みんなの分別が集まると、名古屋の街がふわっと晴れていくよ。
      </Text>
      <View style={{ gap: 9 }}>
        {APP_CONFIG.progressBars.map((bar) => {
          const current = bar.start + ((bar.target - bar.start) * averageClearRate) / 100;
          const fill = clamp((current / bar.target) * 100, 0, 100);
          return (
            <View
              key={bar.id}
              style={{
                backgroundColor: "rgba(255,248,225,0.9)",
                borderColor: "rgba(122,86,42,0.12)",
                borderWidth: 1,
                borderRadius: 18,
                borderCurve: "continuous",
                padding: 10,
                gap: 7,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                <Text selectable style={{ flex: 1, color: "#5d4a35", fontSize: 12, fontWeight: "900" }}>
                  {bar.label}
                </Text>
                <Text selectable style={{ color: "#5d4a35", fontSize: 12, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
                  {current.toFixed(1)}% → {bar.target}%目標
                </Text>
              </View>
              <View
                style={{
                  height: 14,
                  overflow: "hidden",
                  borderRadius: 999,
                  backgroundColor: "rgba(122,86,42,0.12)",
                  borderColor: "rgba(255,255,255,0.95)",
                  borderWidth: 2,
                }}
              >
                <View
                  style={{
                    width: `${fill}%`,
                    height: "100%",
                    borderRadius: 999,
                    backgroundColor: bar.color,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChickLogo() {
  return (
    <View
      style={{
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#ffd86b",
        borderColor: "#fff",
        borderWidth: 3,
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 5px 0 rgba(120,80,30,0.12)",
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 3 }}>
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#553d26" }} />
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#553d26" }} />
      </View>
      <View
        style={{
          width: 12,
          height: 6,
          borderBottomColor: "#553d26",
          borderBottomWidth: 2,
          borderRadius: 999,
        }}
      />
    </View>
  );
}

function NagoyaMapBackdrop() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>
      <View
        style={{
          position: "absolute",
          left: "8%",
          top: "9%",
          width: "76%",
          height: "78%",
          borderRadius: 46,
          borderCurve: "continuous",
          backgroundColor: "rgba(255,255,255,0.16)",
          borderColor: "rgba(255,255,255,0.3)",
          borderWidth: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "8%",
          top: "28%",
          right: "9%",
          height: 7,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.42)",
          transform: [{ rotate: "13deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "5%",
          top: "59%",
          right: "15%",
          height: 9,
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.46)",
          transform: [{ rotate: "-8deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          right: "1%",
          bottom: "2%",
          width: "28%",
          height: "23%",
          borderTopLeftRadius: 30,
          backgroundColor: "rgba(117,198,230,0.42)",
        }}
      />
      <Text
        selectable
        style={{
          position: "absolute",
          right: "6%",
          bottom: "8%",
          color: "rgba(71,116,138,0.72)",
          fontSize: 11,
          fontWeight: "900",
        }}
      >
        名古屋港
      </Text>
    </View>
  );
}

function PlasticPile({ height, opacity }: { height: number; opacity: number }) {
  if (height <= 1) return null;

  const frontWidth = clamp(height * 0.42, 18, 34);

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: "50%",
        bottom: 22,
        width: frontWidth + 14,
        height: height + 16,
        opacity,
        transform: [{ translateX: -(frontWidth + 14) / 2 }],
      }}
    >
      <View
        style={{
          position: "absolute",
          left: 4,
          bottom: 0,
          width: frontWidth,
          height,
          borderRadius: 8,
          backgroundColor: "rgba(147,214,236,0.82)",
          borderColor: "rgba(255,255,255,0.82)",
          borderWidth: 2,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 9,
          bottom: 5,
          width: frontWidth,
          height,
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          backgroundColor: "rgba(81,164,196,0.46)",
          transform: [{ skewY: "-18deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 9,
          bottom: height - 3,
          width: frontWidth,
          height: 14,
          borderRadius: 8,
          backgroundColor: "rgba(211,244,255,0.88)",
          borderColor: "rgba(255,255,255,0.9)",
          borderWidth: 2,
          transform: [{ skewX: "-28deg" }],
        }}
      />
      <View
        style={{
          position: "absolute",
          left: frontWidth * 0.34,
          bottom: height + 8,
          width: 9,
          height: 9,
          borderRadius: 3,
          backgroundColor: "#7cc6dc",
          borderColor: "#fff",
          borderWidth: 1,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: frontWidth * 0.2,
          bottom: 8,
          width: frontWidth * 0.52,
          height: Math.max(8, height - 16),
          borderRadius: 999,
          borderColor: "rgba(255,255,255,0.68)",
          borderWidth: 2,
        }}
      />
    </View>
  );
}

function WardTile({
  ward,
  width,
  height,
  placement,
  selected,
  sparkling,
  onPress,
}: {
  ward: Ward;
  width: number;
  height: number;
  placement: {
    left: number;
    top: number;
    radius: number;
    rotate: string;
  };
  selected: boolean;
  sparkling: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const sparkle = useRef(new Animated.Value(0)).current;
  const mascot = useRef(new Animated.Value(ward.clearRate >= 100 ? 1 : 0)).current;
  const clearRate = ward.clearRate;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.04, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  }, [clearRate, scale]);

  useEffect(() => {
    Animated.spring(mascot, {
      toValue: clearRate >= 100 ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [clearRate, mascot]);

  useEffect(() => {
    if (!sparkling) return;
    sparkle.setValue(0);
    Animated.timing(sparkle, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [sparkle, sparkling]);

  const fogOpacity = clamp(0.9 - ward.clearRate / 118, 0, 0.9);
  const cityOpacity = clamp(0.36 + ward.clearRate / 125, 0.36, 1);
  const plasticHeight = clamp(height * (0.64 - ward.clearRate / 170), 0, height * 0.64);
  const plasticOpacity = ward.clearRate >= 100 ? 0 : clamp(0.3 + (100 - ward.clearRate) / 120, 0.3, 0.96);

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: placement.left,
        top: placement.top,
        width,
        height,
        transform: [{ rotate: placement.rotate }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width,
          height,
          overflow: "hidden",
          borderRadius: placement.radius,
          borderCurve: "continuous",
          backgroundColor: ward.color,
          borderColor: selected ? "#ffd86b" : "rgba(255,255,255,0.86)",
          borderWidth: selected ? 3 : 2,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        })}
      >
        <CityIllustration opacity={cityOpacity} />
        <PlasticPile height={plasticHeight} opacity={plasticOpacity} />

        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            inset: 0,
            opacity: fogOpacity * 0.55,
            backgroundColor: "#f6fbff",
          }}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <View
              key={index}
              style={{
                position: "absolute",
                left: -10,
                right: -10,
                top: index * 17,
                height: 8,
                backgroundColor: index % 2 === 0 ? "#ffffff" : "#d7edf4",
                transform: [{ rotate: "28deg" }],
              }}
            />
          ))}
        </View>

        <Text
          selectable
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          style={{
            position: "absolute",
            left: 7,
            top: 7,
            maxWidth: width - 14,
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.74)",
            color: "#4d4031",
            fontSize: 11,
            fontWeight: "900",
          }}
        >
          {ward.name}
        </Text>

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            opacity: mascot,
            transform: [
              { translateX: -22 },
              { translateY: -20 },
              {
                scale: mascot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 1],
                }),
              },
            ],
          }}
        >
          <MascotIcon kind={ward.mascot} />
        </Animated.View>

        <Text
          selectable
          style={{
            position: "absolute",
            right: 6,
            bottom: 6,
            minWidth: 34,
            paddingHorizontal: 5,
            paddingVertical: 3,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.8)",
            color: "#4d4031",
            fontSize: 11,
            fontWeight: "900",
            textAlign: "center",
            fontVariant: ["tabular-nums"],
          }}
        >
          {ward.clearRate}%
        </Text>

        {sparkling ? (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -20,
              bottom: -20,
              width: 26,
              backgroundColor: "rgba(255,255,255,0.88)",
              opacity: sparkle.interpolate({
                inputRange: [0, 0.35, 1],
                outputRange: [0, 1, 0],
              }),
              transform: [
                { rotate: "18deg" },
                {
                  translateX: sparkle.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, width + 40],
                  }),
                },
              ],
            }}
          />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function CityIllustration({ opacity }: { opacity: number }) {
  return (
    <View pointerEvents="none" style={{ position: "absolute", inset: 0, opacity }}>
      <View
        style={{
          position: "absolute",
          left: "12%",
          right: "12%",
          bottom: "18%",
          height: "28%",
          flexDirection: "row",
          overflow: "hidden",
          borderRadius: 8,
        }}
      >
        {["#7cc6dc", "#84d09c", "#ffc76d", "#f59fb3"].map((color) => (
          <View key={color} style={{ flex: 1, backgroundColor: color }} />
        ))}
      </View>
      <View
        style={{
          position: "absolute",
          left: "20%",
          right: "20%",
          bottom: "11%",
          height: "11%",
          borderRadius: 999,
          backgroundColor: "rgba(72,164,104,0.34)",
        }}
      />
    </View>
  );
}

function MascotIcon({ kind }: { kind: MascotKind }) {
  switch (kind) {
    case "chick":
      return <ChickIcon />;
    case "gorilla":
      return <GorillaIcon />;
    case "flower":
      return <FlowerIcon />;
    case "leaf":
      return <LeafIcon />;
    case "castle":
      return <CastleIcon />;
    case "shachihoko":
      return <ShachihokoIcon />;
    case "star":
    default:
      return <StarIcon />;
  }
}

function BaseIcon({ children, color }: { children?: React.ReactNode; color: string }) {
  return (
    <View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        borderColor: "#fff",
        borderWidth: 3,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </View>
  );
}

function ChickIcon() {
  return (
    <BaseIcon color="#ffd86b">
      <View style={{ flexDirection: "row", gap: 11 }}>
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#5b3a22" }} />
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#5b3a22" }} />
      </View>
      <View style={{ width: 10, height: 5, borderBottomColor: "#5b3a22", borderBottomWidth: 2, borderRadius: 999 }} />
    </BaseIcon>
  );
}

function GorillaIcon() {
  return (
    <BaseIcon color="#7f7367">
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 6 }}>
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#2e271f" }} />
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#2e271f" }} />
      </View>
      <View style={{ width: 22, height: 13, borderRadius: 10, backgroundColor: "#cab9a3" }} />
    </BaseIcon>
  );
}

function FlowerIcon() {
  return (
    <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      {[
        { left: 14, top: 0 },
        { left: 26, top: 12 },
        { left: 14, top: 24 },
        { left: 2, top: 12 },
      ].map((pos, index) => (
        <View
          key={index}
          style={{
            position: "absolute",
            left: pos.left,
            top: pos.top,
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: "#ff9cb1",
            borderColor: "#fff",
            borderWidth: 2,
          }}
        />
      ))}
      <View style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: "#ffd85e", borderColor: "#fff", borderWidth: 2 }} />
    </View>
  );
}

function LeafIcon() {
  return (
    <View
      style={{
        width: 42,
        height: 42,
        borderTopLeftRadius: 28,
        borderBottomRightRadius: 28,
        borderTopRightRadius: 6,
        borderBottomLeftRadius: 6,
        borderColor: "#fff",
        borderWidth: 3,
        backgroundColor: "#75c99a",
        transform: [{ rotate: "-16deg" }],
      }}
    />
  );
}

function CastleIcon() {
  return (
    <View style={{ width: 44, height: 44, alignItems: "center", justifyContent: "flex-end" }}>
      <View style={{ flexDirection: "row", gap: 2, marginBottom: -2 }}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={{ width: 9, height: 11, backgroundColor: "#78b7d1", borderRadius: 3 }} />
        ))}
      </View>
      <View
        style={{
          width: 36,
          height: 28,
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 3,
          backgroundColor: "#ffffff",
        }}
      >
        <View style={{ height: 8, backgroundColor: "#9ed8f2", borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
        <View style={{ flex: 1, backgroundColor: "#75c99a", borderBottomLeftRadius: 5, borderBottomRightRadius: 5 }} />
      </View>
    </View>
  );
}

function ShachihokoIcon() {
  return (
    <BaseIcon color="#ffd45b">
      <View
        style={{
          position: "absolute",
          right: -3,
          top: 7,
          width: 16,
          height: 25,
          borderTopLeftRadius: 16,
          borderBottomRightRadius: 16,
          backgroundColor: "#f4a927",
          borderColor: "#fff",
          borderWidth: 2,
          transform: [{ rotate: "-24deg" }],
        }}
      />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#5b3a22" }} />
        <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: "#5b3a22" }} />
      </View>
    </BaseIcon>
  );
}

function StarIcon() {
  return (
    <BaseIcon color="#ffd45b">
      <View style={{ width: 19, height: 19, backgroundColor: "#fff2a8", transform: [{ rotate: "45deg" }] }} />
    </BaseIcon>
  );
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        borderCurve: "continuous",
        backgroundColor: pressed ? "#ffd86b" : "#ffe49a",
        boxShadow: pressed
          ? "0 2px 0 #eab958"
          : "0 7px 0 #eab958, 0 14px 20px rgba(135,91,28,0.14)",
        transform: [{ translateY: pressed ? 5 : 0 }],
      })}
    >
      <Text style={{ color: "#50391f", fontSize: 15, fontWeight: "900" }}>{label}</Text>
    </Pressable>
  );
}

function DetailPanel({ ward }: { ward: Ward }) {
  return (
    <View
      style={{
        backgroundColor: "rgba(255,255,255,0.74)",
        borderColor: "rgba(255,255,255,0.86)",
        borderWidth: 2,
        borderRadius: 24,
        borderCurve: "continuous",
        padding: 14,
        gap: 8,
        boxShadow: "0 14px 30px rgba(154,112,56,0.16)",
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <Text selectable style={{ color: "#4d4031", fontSize: 20, fontWeight: "900" }}>
          {ward.name}
        </Text>
        <Text selectable style={{ color: "#e88c4c", fontSize: 20, fontWeight: "900", fontVariant: ["tabular-nums"] }}>
          {ward.clearRate}%
        </Text>
      </View>
      <View style={{ height: 12, borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(122,86,42,0.12)" }}>
        <View style={{ width: `${ward.clearRate}%`, height: "100%", borderRadius: 999, backgroundColor: "#75c99a" }} />
      </View>
      <Text selectable style={{ color: "#7b6b57", fontSize: 14, fontWeight: "700", lineHeight: 22 }}>
        投稿数: {formatNumber(ward.posts)}件
      </Text>
      <Text selectable style={{ color: "#7b6b57", fontSize: 14, fontWeight: "700", lineHeight: 22 }}>
        残っているプラスチックの高さ: {100 - ward.clearRate}%
      </Text>
      <Text selectable style={{ color: "#7b6b57", fontSize: 14, fontWeight: "700", lineHeight: 22 }}>
        {getMessage(ward)}
      </Text>
    </View>
  );
}

function CelebrationOverlay({ seed, onClose }: { seed: number; onClose: () => void }) {
  return (
    <View
      style={{
        position: "absolute",
        inset: 0,
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
        backgroundColor: "rgba(255,247,223,0.78)",
      }}
    >
      {Array.from({ length: 56 }).map((_, index) => (
        <ConfettiPiece key={`${seed}-${index}`} index={index} />
      ))}
      <View
        style={{
          width: "100%",
          maxWidth: 390,
          padding: 22,
          borderRadius: 30,
          borderCurve: "continuous",
          backgroundColor: "rgba(255,255,255,0.94)",
          borderColor: "#fff",
          borderWidth: 3,
          alignItems: "center",
          gap: 12,
          boxShadow: "0 24px 60px rgba(121,82,27,0.24)",
        }}
      >
        <Text selectable style={{ color: "#4d4031", fontSize: 27, fontWeight: "900", textAlign: "center" }}>
          ピカピカの名古屋、完成！
        </Text>
        <Text selectable style={{ color: "#7b6b57", fontSize: 15, fontWeight: "700", lineHeight: 24, textAlign: "center" }}>
          16区すべてのモザイクが晴れました。みんなの分別で、街が花と緑でいっぱいです。
        </Text>
        <Pressable
          onPress={onClose}
          style={({ pressed }) => ({
            minHeight: 44,
            alignSelf: "stretch",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            borderCurve: "continuous",
            backgroundColor: pressed ? "#bcebd1" : "#d7f4e0",
          })}
        >
          <Text style={{ color: "#50391f", fontSize: 14, fontWeight: "900" }}>
            マップを見る
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ConfettiPiece({ index }: { index: number }) {
  const fall = useRef(new Animated.Value(0)).current;
  const colors = ["#ffb9c8", "#ffd86b", "#75c99a", "#9ed8f2", "#ffbd73", "#cdb8ff"];
  const left = `${(index * 19) % 100}%` as `${number}%`;
  const delay = (index % 12) * 75;

  useEffect(() => {
    fall.setValue(0);
    Animated.timing(fall, {
      toValue: 1,
      duration: 2400 + (index % 7) * 180,
      delay,
      useNativeDriver: true,
    }).start();
  }, [delay, fall, index]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left,
        top: -18,
        width: 9,
        height: 14,
        borderRadius: 4,
        backgroundColor: colors[index % colors.length],
        opacity: fall.interpolate({
          inputRange: [0, 0.15, 1],
          outputRange: [0, 1, 0.25],
        }),
        transform: [
          {
            translateY: fall.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 900],
            }),
          },
          {
            rotate: fall.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", "620deg"],
            }),
          },
        ],
      }}
    />
  );
}
