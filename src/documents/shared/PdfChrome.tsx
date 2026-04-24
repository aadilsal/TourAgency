import React from "react";
/* eslint-disable jsx-a11y/alt-text -- React-PDF Image doesn’t support alt */
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";

export type PdfFooterContact = {
  phone?: string;
  email?: string;
  website?: string;
  officeAddress?: string;
};

export function formatFooterStrip(contact: PdfFooterContact | undefined) {
  if (!contact) return "";
  const parts = [
    contact.phone?.trim(),
    contact.email?.trim(),
    contact.website?.trim(),
    contact.officeAddress?.trim(),
  ].filter((x): x is string => Boolean(x));
  return parts.join(" | ");
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    left: 40,
    right: 40,
    top: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 28, height: 28, objectFit: "contain" },
  companyName: { fontSize: 11, fontWeight: 700, color: "#0f172a" },
  licence: { fontSize: 9, color: "#475569" },
  footerStrip: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    backgroundColor: "#0f172a",
    paddingHorizontal: 40,
    justifyContent: "center",
  },
  footerText: { fontSize: 9, color: "#ffffff" },
});

function SafeImage({ src, style }: { src: string | null | undefined; style?: unknown }) {
  if (!src) return null;
  return <Image src={src} style={style as never} />;
}

export function PdfHeader({
  logoUrl,
  companyName,
  licenceNumber,
}: {
  logoUrl?: string | null;
  companyName?: string;
  licenceNumber?: string;
}) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerLeft}>
        <SafeImage src={logoUrl ?? undefined} style={styles.logo} />
        <Text style={styles.companyName}>{companyName?.trim() || "JunketTours"}</Text>
      </View>
      <Text style={styles.licence}>
        {licenceNumber?.trim() ? `Licence #${licenceNumber.trim()}` : " "}
      </Text>
    </View>
  );
}

export function PdfFooterStrip({ contact }: { contact?: PdfFooterContact }) {
  const strip = formatFooterStrip(contact);
  return (
    <View style={styles.footerStrip} fixed>
      <Text style={styles.footerText}>{strip || " "}</Text>
    </View>
  );
}

