import jsPDF from "jspdf";
import QRCode from "qrcode";
import { format } from "date-fns";
import type { AllTicketItem } from "@/hooks/use-events";

export async function generateTicketPDF(ticket: AllTicketItem): Promise<void> {
  const qrDataUrl = await QRCode.toDataURL(ticket.code, {
    width: 200,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [140, 80],
  });

  const w = 140;
  const h = 80;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, w, h, "F");

  // Top accent bar
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, w, 10, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("CHURCHOS EVENT PASS", w / 2, 6.5, { align: "center" });

  // QR code (left side)
  const qrImg = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  doc.addImage(qrImg, "PNG", 8, 14, 28, 28);

  // Ticket code under QR
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text(ticket.code, 22, 45, { align: "center" });

  // Details (right side)
  const x = 42;
  let y = 16;

  const addField = (label: string, value: string) => {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(label, x, y);
    y += 4;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const lines = doc.splitTextToSize(value, w - x - 8);
    doc.text(lines, x, y);
    y += lines.length * 4 + 2;
  };

  addField("EVENT", ticket.eventName);
  addField("DATE", format(new Date(ticket.eventDate), "EEEE, MMM d, yyyy"));
  if (ticket.eventLocation) {
    addField("LOCATION", ticket.eventLocation);
  }

  // Right column
  const x2 = 100;
  y = 16;

  const attendeeName = ticket.memberName || ticket.visitorName;

  if (attendeeName) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text("ATTENDEE", x2, y);
    y += 4;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(attendeeName, x2, y);
    y += 10;
  }

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("TIER", x2, y);
  y += 4;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(ticket.tierName ?? "General", x2, y);
  y += 10;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("STATUS", x2, y);
  y += 4;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(ticket.status.toUpperCase(), x2, y);

  // Bottom accent bar
  doc.setFillColor(30, 41, 59);
  doc.rect(0, h - 4, w, 4, "F");

  doc.save(`ticket-${ticket.code}.pdf`);
}
