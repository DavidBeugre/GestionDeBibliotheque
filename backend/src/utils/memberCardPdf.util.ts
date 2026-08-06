import PDFDocument from 'pdfkit';

export function createMemberCardPdf(member: {
  matricule: string;
  cardNumber: string | null;
  memberType: string;
  status: string;
  user: { firstName: string; lastName: string; email: string };
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [242.65, 153.07], margin: 14 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#14532D');
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(18).text('SHELF L Y', 14, 16);
    doc.font('Helvetica').fontSize(8).fillColor('#D1FAE5').text('CARTE D’ADHÉRENT', 14, 40);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(15).text(`${member.user.firstName} ${member.user.lastName}`, 14, 66);
    doc.font('Helvetica').fontSize(9).fillColor('#D1FAE5').text(member.user.email, 14, 88);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(10).text(member.matricule, 14, 112);
    doc.font('Helvetica').fontSize(8).fillColor('#D1FAE5').text(`${member.memberType} · ${member.status} · ${member.cardNumber ?? '—'}`, 14, 128);
    doc.end();
  });
}
