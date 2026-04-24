import React from "react";
/* eslint-disable jsx-a11y/alt-text -- React-PDF Image doesn’t support alt */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { PdfFooterStrip, PdfHeader } from "@/documents/shared/PdfChrome";

export type ItineraryPdfModel = {
  includeEmptySections?: boolean;
  headline: string;
  variantLabel: string;
  tripTitle: string;
  coverSubtitle?: string;
  clientName: string;
  nightsLabel: string;
  daysLabel: string;
  dateRangeLabel: string;
  pickupDropoff?: string;
  complianceLine?: string;
  licenceNumber?: string;

  companyName?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
    officeAddress?: string;
  };
  coverImageUrl?: string | null;
  logoUrl?: string | null;

  dayPlans?: Array<{
    dayNumber: number;
    title: string;
    imageUrl?: string | null;
    highlights?: string[];
    overnight?: string;
    morning?: Array<{ title: string; description: string }>;
    afternoon?: Array<{ title: string; description: string }>;
    evening?: Array<{ title: string; description: string }>;
  }>;
  included?: string[];
  notIncluded?: string[];

  packages?: Array<{
    name: string;
    priceLabel: string;
    vehicle?: string;
    stays?: Array<{ location: string; hotel: string; nights: number }>;
    note?: string;
  }>;

  paymentTerms?: Array<{ percent: number; title: string; description?: string }>;
  bankDetails?: {
    bankName?: string;
    accountTitle?: string;
    accountNumber?: string;
    iban?: string;
    instruction?: string;
  };

  termsBlocks?: Array<{ title: string; body: string }>;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 72,
    paddingHorizontal: 40,
    fontSize: 11,
    color: "#0f172a",
    fontFamily: "Helvetica",
    lineHeight: 1.35,
  },
  muted: { color: "#475569" },
  h1: { fontSize: 30, fontWeight: 700, letterSpacing: -0.5 },
  h2: { fontSize: 16, fontWeight: 700 },
  smallCaps: { fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase" },
  cover: { padding: 0 },
  header: {},
  headerLeft: {},
  headerLogo: {},
  headerName: {},
  headerRight: {},
  headerLicence: {},
  footer: {},
  footerText: {},
  coverImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  coverOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  coverInner: { padding: 46, flex: 1, justifyContent: "space-between" },
  coverTop: { flexDirection: "row", justifyContent: "space-between" },
  coverLogo: { width: 72, height: 72, objectFit: "contain" },
  coverBottom: { gap: 10 },
  coverMetaRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  metaPill: {
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
  },
  metaText: { color: "white", fontSize: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 700 },
  dayRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  dayNum: {
    width: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumText: { color: "white", fontSize: 10, fontWeight: 700 },
  dayBody: { flex: 1 },
  dayTitle: { fontSize: 12, fontWeight: 700 },
  highlightsText: { marginTop: 4, lineHeight: 1.4 },
  dayCard: {
    marginTop: 12,
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  dayCover: { width: "100%", height: 120, objectFit: "cover" },
  dayCardInner: { padding: 14 },
  dayMeta: { marginTop: 6, color: "#475569", lineHeight: 1.4 },
  slotsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  slot: {
    flex: 1,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 10,
  },
  slotTitle: { fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: "#475569", fontWeight: 700 },
  slotItemTitle: { marginTop: 8, fontSize: 10, fontWeight: 700 },
  slotItemBody: { marginTop: 2, fontSize: 10, color: "#475569", lineHeight: 1.35 },
  card: {
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: 14,
    backgroundColor: "#ffffff",
  },
  listItem: { marginBottom: 6 },
  pkgCard: { marginTop: 10 },
  pkgName: { fontSize: 13, fontWeight: 700 },
  pkgPrice: { marginTop: 2, fontSize: 12, fontWeight: 700, color: "#0f172a" },
  pkgMuted: { marginTop: 2, color: "#475569" },
  payRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  payBox: {
    flex: 1,
    borderRadius: 14,
    border: "1px solid #e2e8f0",
    padding: 12,
    backgroundColor: "#f8fafc",
  },
  payPct: { fontSize: 18, fontWeight: 700 },
});

function SafeImage({
  src,
  style,
}: {
  src: string | null | undefined;
  style?: unknown;
}) {
  if (!src) return null;
  return <Image src={src} style={style as never} />;
}

function Chrome({ model }: { model: ItineraryPdfModel }) {
  return (
    <>
      <PdfHeader
        logoUrl={model.logoUrl}
        companyName={model.companyName}
        licenceNumber={model.licenceNumber}
      />
      <PdfFooterStrip
        contact={{
          phone: model.contact?.phone,
          email: model.contact?.email,
          website: model.contact?.website,
          officeAddress: model.contact?.officeAddress,
        }}
      />
    </>
  );
}

export function ItineraryPdf({ model }: { model: ItineraryPdfModel }) {
  const coverTitle = model.headline?.trim() || "Your Dream Trip Awaits —";
  const variant = model.variantLabel?.trim() || "";
  const clientName = model.clientName?.trim() || "";
  const dateRange = model.dateRangeLabel?.trim() || "";
  const showEmptySections = model.includeEmptySections ?? true;

  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.cover]}>
        <SafeImage src={model.coverImageUrl ?? undefined} style={styles.coverImage} />
        <View style={styles.coverOverlay} />
        <View style={styles.coverInner}>
          <View style={styles.coverTop}>
            <View />
            <SafeImage src={model.logoUrl ?? undefined} style={styles.coverLogo} />
          </View>

          <View style={styles.coverBottom}>
            <Text style={[styles.h1, { color: "white" }]}>{coverTitle}</Text>
            {variant ? (
              <Text style={[styles.h2, { color: "white", marginTop: 6 }]}>{variant}</Text>
            ) : null}
            {model.coverSubtitle?.trim() ? (
              <Text style={[styles.muted, { color: "rgba(255,255,255,0.9)", marginTop: 6 }]}>
                {model.coverSubtitle}
              </Text>
            ) : null}
            {model.complianceLine?.trim() ? (
              <Text style={[styles.muted, { color: "rgba(255,255,255,0.9)", marginTop: 6 }]}>
                {model.complianceLine}
              </Text>
            ) : null}
            {model.licenceNumber?.trim() ? (
              <Text style={[styles.muted, { color: "rgba(255,255,255,0.9)", marginTop: 2 }]}>
                {`Licence #${model.licenceNumber.trim()}`}
              </Text>
            ) : null}
            {dateRange ? (
              <Text style={[styles.muted, { color: "rgba(255,255,255,0.9)", marginTop: 6 }]}>
                {`Travel dates: ${dateRange}.`}
              </Text>
            ) : null}
            {model.pickupDropoff?.trim() ? (
              <Text style={[styles.muted, { color: "rgba(255,255,255,0.9)", marginTop: 2 }]}>
                {model.pickupDropoff}
              </Text>
            ) : null}
            <View style={styles.coverMetaRow}>
              {clientName ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{clientName}</Text>
                </View>
              ) : null}
              {model.nightsLabel ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{model.nightsLabel}</Text>
                </View>
              ) : null}
              {model.daysLabel ? (
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{model.daysLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </Page>

      {showEmptySections || (model.dayPlans ?? []).length > 0 ? (
        <Page size="A4" style={styles.page}>
          <Chrome model={model} />
          <Text style={styles.sectionTitle}>{`Your ${model.daysLabel || ""} Itinerary`.trim()}</Text>
          {(model.dayPlans ?? []).map((d) => {
            const highlights = d.highlights?.length ? d.highlights.join(", ") : "";
            const overnight = d.overnight?.trim() ? d.overnight.trim() : "";
            const meta = [highlights, overnight].filter(Boolean).join(" · ");

            const morning = (d.morning ?? []).filter((x) => x.title.trim() || x.description.trim());
            const afternoon = (d.afternoon ?? []).filter((x) => x.title.trim() || x.description.trim());
            const evening = (d.evening ?? []).filter((x) => x.title.trim() || x.description.trim());

            return (
              <View key={`d-${d.dayNumber}`} style={styles.dayCard}>
                {d.imageUrl ? (
                  <SafeImage src={d.imageUrl} style={styles.dayCover} />
                ) : null}
                <View style={styles.dayCardInner}>
                  <View style={styles.dayRow}>
                    <View style={styles.dayNum}>
                      <Text style={styles.dayNumText}>{d.dayNumber}</Text>
                    </View>
                    <View style={styles.dayBody}>
                      <Text style={styles.dayTitle}>{`Day ${d.dayNumber} — ${d.title}`}</Text>
                      {meta ? <Text style={styles.dayMeta}>{meta}</Text> : null}
                    </View>
                  </View>

                  {(morning.length || afternoon.length || evening.length) ? (
                    <View style={styles.slotsRow}>
                      <View style={styles.slot}>
                        <Text style={styles.slotTitle}>Morning</Text>
                        {morning.length ? (
                          morning.slice(0, 3).map((a, idx) => (
                            <View key={`m-${d.dayNumber}-${idx}`}>
                              <Text style={styles.slotItemTitle}>{a.title || "—"}</Text>
                              {a.description?.trim() ? (
                                <Text style={styles.slotItemBody}>{a.description}</Text>
                              ) : null}
                            </View>
                          ))
                        ) : (
                          <Text style={styles.slotItemBody}>—</Text>
                        )}
                      </View>
                      <View style={styles.slot}>
                        <Text style={styles.slotTitle}>Afternoon</Text>
                        {afternoon.length ? (
                          afternoon.slice(0, 3).map((a, idx) => (
                            <View key={`a-${d.dayNumber}-${idx}`}>
                              <Text style={styles.slotItemTitle}>{a.title || "—"}</Text>
                              {a.description?.trim() ? (
                                <Text style={styles.slotItemBody}>{a.description}</Text>
                              ) : null}
                            </View>
                          ))
                        ) : (
                          <Text style={styles.slotItemBody}>—</Text>
                        )}
                      </View>
                      <View style={styles.slot}>
                        <Text style={styles.slotTitle}>Evening</Text>
                        {evening.length ? (
                          evening.slice(0, 3).map((a, idx) => (
                            <View key={`e-${d.dayNumber}-${idx}`}>
                              <Text style={styles.slotItemTitle}>{a.title || "—"}</Text>
                              {a.description?.trim() ? (
                                <Text style={styles.slotItemBody}>{a.description}</Text>
                              ) : null}
                            </View>
                          ))
                        ) : (
                          <Text style={styles.slotItemBody}>—</Text>
                        )}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </Page>
      ) : null}

      {showEmptySections ||
      (model.included ?? []).length > 0 ||
      (model.notIncluded ?? []).length > 0 ? (
        <Page size="A4" style={styles.page}>
          <Chrome model={model} />
          <Text style={styles.sectionTitle}>What&apos;s Included &amp; What&apos;s Not</Text>
          <View style={{ marginTop: 12, flexDirection: "row", gap: 14 }}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={[styles.smallCaps, styles.muted]}>Included ✔</Text>
              <View style={{ marginTop: 10 }}>
                {(model.included ?? []).length === 0 ? (
                  <Text style={styles.muted}>—</Text>
                ) : (
                  (model.included ?? []).slice(0, 18).map((t, i) => (
                    <Text key={`inc-${i}`} style={styles.listItem}>
                      {t}
                    </Text>
                  ))
                )}
              </View>
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={[styles.smallCaps, styles.muted]}>Not Included ✖</Text>
              <View style={{ marginTop: 10 }}>
                {(model.notIncluded ?? []).length === 0 ? (
                  <Text style={styles.muted}>—</Text>
                ) : (
                  (model.notIncluded ?? []).slice(0, 18).map((t, i) => (
                    <Text key={`exc-${i}`} style={styles.listItem}>
                      {t}
                    </Text>
                  ))
                )}
              </View>
            </View>
          </View>
        </Page>
      ) : null}

      <Page size="A4" style={styles.page}>
        <Chrome model={model} />
        <Text style={styles.sectionTitle}>Choose Your Package</Text>
        <Text style={[styles.muted, { marginTop: 6, lineHeight: 1.4 }]}>
          All packages are for two adults. Prices exclude air tickets — airfares will be added at time of booking.
        </Text>
        {(model.packages ?? []).slice(0, 6).map((p, idx) => (
          <View key={`pkg-${idx}`} style={[styles.card, styles.pkgCard]}>
            <Text style={styles.pkgName}>{p.name}</Text>
            <Text style={styles.pkgPrice}>{p.priceLabel}</Text>
            {p.vehicle?.trim() ? (
              <Text style={styles.pkgMuted}>{p.vehicle}</Text>
            ) : null}
            {(p.stays ?? []).length ? (
              <View style={{ marginTop: 8 }}>
                {(p.stays ?? []).map((s, i) => (
                  <Text key={`stay-${idx}-${i}`} style={styles.pkgMuted}>
                    {`${s.location}: ${s.hotel} (${s.nights}N)`}
                  </Text>
                ))}
              </View>
            ) : null}
            {p.note?.trim() ? <Text style={styles.pkgMuted}>{p.note}</Text> : null}
          </View>
        ))}
      </Page>

      {showEmptySections ||
      (model.paymentTerms ?? []).length > 0 ||
      Boolean(
        model.bankDetails?.bankName ||
          model.bankDetails?.accountTitle ||
          model.bankDetails?.accountNumber ||
          model.bankDetails?.iban ||
          model.bankDetails?.instruction,
      ) ? (
        <Page size="A4" style={styles.page}>
          <Chrome model={model} />
          <Text style={styles.sectionTitle}>Payment Terms &amp; How to Book</Text>
          <View style={styles.payRow}>
            {(model.paymentTerms ?? []).slice(0, 3).map((t, idx) => (
              <View key={`pt-${idx}`} style={styles.payBox}>
                <Text style={styles.payPct}>{`${t.percent}%`}</Text>
                <Text style={{ marginTop: 6, fontWeight: 700 }}>{t.title}</Text>
                <Text style={[styles.muted, { marginTop: 4, lineHeight: 1.4 }]}>
                  {t.description?.trim() || "—"}
                </Text>
              </View>
            ))}
          </View>
          <View style={[styles.card, { marginTop: 14 }]}>
            <Text style={[styles.smallCaps, styles.muted]}>Bank transfer</Text>
            <Text style={{ marginTop: 8, lineHeight: 1.5 }}>
              {(model.bankDetails?.bankName && `Bank: ${model.bankDetails.bankName} | `) || ""}
              {(model.bankDetails?.accountTitle && `Account: ${model.bankDetails.accountTitle} | `) || ""}
              {(model.bankDetails?.accountNumber && `Acc No: ${model.bankDetails.accountNumber} | `) || ""}
              {(model.bankDetails?.iban && `IBAN: ${model.bankDetails.iban}`) || ""}
            </Text>
            {model.bankDetails?.instruction?.trim() ? (
              <Text style={[styles.muted, { marginTop: 8, lineHeight: 1.4 }]}>
                {model.bankDetails.instruction}
              </Text>
            ) : null}
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.smallCaps, styles.muted]}>Contact</Text>
              {model.contact?.officeAddress?.trim() ? (
                <Text style={[styles.muted, { marginTop: 6 }]}>{model.contact.officeAddress}</Text>
              ) : null}
              {model.contact?.email?.trim() ? (
                <Text style={[styles.muted, { marginTop: 2 }]}>{model.contact.email}</Text>
              ) : null}
              {model.contact?.website?.trim() ? (
                <Text style={[styles.muted, { marginTop: 2 }]}>{model.contact.website}</Text>
              ) : null}
              {model.contact?.phone?.trim() ? (
                <Text style={[styles.muted, { marginTop: 2 }]}>{model.contact.phone}</Text>
              ) : null}
            </View>
          </View>
        </Page>
      ) : null}

      {showEmptySections || (model.termsBlocks ?? []).length > 0 ? (
        <Page size="A4" style={styles.page}>
          <Chrome model={model} />
          <Text style={styles.sectionTitle}>Terms &amp; Conditions</Text>
          <View style={{ marginTop: 12 }}>
            {(model.termsBlocks ?? []).slice(0, 8).map((b, idx) => (
              <View key={`tb-${idx}`} style={[styles.card, { marginTop: 10 }]}>
                <Text style={{ fontWeight: 700 }}>{b.title}</Text>
                <Text style={[styles.muted, { marginTop: 6, lineHeight: 1.5 }]}>
                  {b.body}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      ) : null}
    </Document>
  );
}

