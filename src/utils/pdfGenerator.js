const PDFDocument = require('pdfkit');

/**
 * Generates a standard medical prescription PDF buffer stream
 * @param {Object} res - Express response object
 * @param {Object} data - Processed database entries (consultation, patient, doctor info)
 */
exports.generatePrescriptionPDF = (res, data) => {
    const { id, pDate, pName, pAge, pGender, pPhone, dName, consultation } = data;



    
    // 1. Naya PDF Document Instance Initialize kiya
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    // Stream PDF direct to the client response output object
    doc.pipe(res);

    // Header Section
    doc.fillColor('#791b40').fontSize(26).text('1C Hospital', { align: 'center', stroke: true });
    doc.fontSize(16).fillColor('#555555').text('Medical Prescription Record', { align: 'center' });
    doc.moveDown(1);

    // Visual Divider Bar (Decorative Lines)
    doc.rect(40, doc.y, 515, 3).fill('#791b40');
    doc.moveDown(1);

    // Metadata Grid
    doc.fillColor('#333333').fontSize(11);
    doc.text(`Prescription Number: #${id}`, 40, doc.y);
    doc.text(`Date: ${pDate}`, 350, doc.y - 12);
    doc.moveDown(1);

    doc.rect(40, doc.y, 515, 1).fill('#dddddd');
    doc.moveDown(1);

    // Patient Section Title Layout
    doc.fillColor('#791b40').fontSize(14).text('Patient Details:', 40, doc.y);
    doc.moveDown(0.5);
    
    doc.fillColor('#333333').fontSize(11);
    doc.text(`Full Name: ${pName}`);
    doc.text(`Age: ${pAge}    |    Gender: ${pGender}`);
    doc.text(`Contact: ${pPhone}`);
    doc.moveDown(1);

    doc.rect(40, doc.y, 515, 1).fill('#dddddd');
    doc.moveDown(1);

    // Clinical Diagnosis Notes
    doc.fillColor('#791b40').fontSize(14).text('Clinical Notes / Diagnosis:', 40, doc.y);
    doc.moveDown(0.5);
    doc.fillColor('#333333').fontSize(11).text(consultation.notes || 'No generic clinical summaries attached.', { width: 500 });
    doc.moveDown(1.5);

    // Table Header: Medications 
    doc.fillColor('#791b40').fontSize(14).text('Prescribed Medications List:', 40, doc.y);
    doc.moveDown(0.5);

    // Draw Table Structure Layout
    let tableTop = doc.y;
    doc.fillColor('#791b40').rect(40, tableTop, 515, 20).fill();
    
    // Header Texts
    doc.fillColor('#ffffff').fontSize(10);
    doc.text('Medicine Name', 45, tableTop + 5);
    doc.text('Dosage', 220, tableTop + 5);
    doc.text('Route', 340, tableTop + 5);
    doc.text('Frequency', 440, tableTop + 5);
    
    let currentY = tableTop + 20;

    // Loop over medication arrays
    if (consultation.prescriptions && consultation.prescriptions.length > 0) {
        consultation.prescriptions.forEach((med) => {
            doc.fillColor('#333333').fontSize(10);
            doc.text(med.medicineName || 'N/A', 45, currentY + 5);
            doc.text(med.dosage || 'N/A', 220, currentY + 5);
            doc.text(med.route || 'Oral', 340, currentY + 5);
            doc.text(med.frequency || 'As Directed', 440, currentY + 5);
            
            // Light bottom row line block border layout
            doc.rect(40, currentY + 18, 515, 1).fill('#eeeeee');
            currentY += 20;
        });
    } else {
        doc.fillColor('#777777').text('No dynamic medicine courses prescribed.', 45, currentY + 5);
        currentY += 20;
    }

    // Doctor Signature Section
    doc.moveDown(3);
    doc.fillColor('#333333').fontSize(11);
    doc.text(`Authorized Medical Practitioner: ${dName}`, 40, currentY + 30);
    doc.fontSize(9).fillColor('#777777').text('Generated securely via 1C Healthcare Engine Server.', 40, currentY + 45);

    // Finalize document build routine
    doc.end();
};