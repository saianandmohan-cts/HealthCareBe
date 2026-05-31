const PDFDocument = require('pdfkit');

exports.generatePrescriptionPDF = (res, data) => {
    const id = data.id || data.consultationId || (data.consultation && data.consultation._id) || 'N/A';
    const rawDate = data.pDate || data.date || new Date();

    const pDate = new Date(rawDate).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
    });   
    const pName = data.pName || data.patient?.name || 'Unknown Patient';
    const pAge = data.pAge || data.patient?.age || 'N/A';
    const pGender = data.pGender || data.patient?.gender || 'Not Specified';
    const pPhone = data.pPhone || data.patient?.phone || data.patient?.contactNumber || 'N/A';
    const pAddress = data.patient?.address || 'N/A';
    const pAllergies = data.patient?.allergies || (data.patient?.allergy ? data.patient.allergy.join(', ') : 'None recorded');
    
    const dName = data.dName || data.physician?.name || 'Hospital Doctor';
    const dDept = data.physician?.department || 'General Medicine';
    
    const consultationData = data.consultation || data;
    const notes = data.notes || consultationData.notes || 'No generic clinical summaries attached.';
    const medicationsList = data.medications || consultationData.prescriptions || [];

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    doc.pipe(res);


    doc.fillColor('#0f766e').fontSize(26).text('1C Hospital', 40, 40, { align: 'left', font: 'Helvetica-Bold' });
    doc.fontSize(10).fillColor('#66788a').text('PREMIUM HEALTHCARE SERVICES', 41, doc.y);
    
    doc.fontSize(14).fillColor('#0f7db7').text('Medical Prescription Record', 40, 48, { align: 'right' });
    doc.moveDown(1.5);

    let currentY = doc.y;
    doc.rect(40, currentY, 350, 4).fill('#0f766e');   
    doc.rect(390, currentY, 165, 4).fill('#0f7db7'); 
    doc.moveDown(1.5);

    currentY = doc.y;
    doc.fillColor('#102133').fontSize(11);
    doc.text(`Prescription No: `, 40, currentY, { continued: true }).fillColor('#0f766e').text(`#${id}`);
    doc.fillColor('#102133').text(`Date: ${pDate}`, 380, currentY, { align: 'right' });
    doc.moveDown(1.2);

    doc.rect(40, doc.y, 515, 1).fill('#d8e4ea'); 
    doc.moveDown(1.2);

    doc.fillColor('#0f766e').fontSize(13).text('Patient Information', 40, doc.y, { font: 'Helvetica-Bold' });
    doc.moveDown(0.6);
    
    currentY = doc.y;
    doc.fillColor('#102133').fontSize(10);
    
    doc.text(`Full Name:`, 40, currentY).font('Helvetica-Bold').text(` ${pName}`, 110, currentY).font('Helvetica');
    doc.text(`Age / Gender:`, 40, currentY + 16).font('Helvetica-Bold').text(` ${pAge} Yrs  /  ${pGender}`, 110, currentY + 16).font('Helvetica');
    doc.text(`Contact No:`, 40, currentY + 32).font('Helvetica-Bold').text(` ${pPhone}`, 110, currentY + 32).font('Helvetica');
    
    doc.text(`Address:`, 320, currentY).font('Helvetica-Bold').text(` ${pAddress}`, 380, currentY, { width: 175 }).font('Helvetica');
    doc.text(`Allergies:`, 320, currentY + 32).font('Helvetica-Bold').text(` ${pAllergies}`, 380, currentY + 32, { width: 175 }).fillColor('#ff4d4d').font('Helvetica');
    
    doc.y = currentY + 55; 
    doc.rect(40, doc.y, 515, 1).fill('#d8e4ea');
    doc.moveDown(1.2);

    doc.fillColor('#0f766e').fontSize(13).text('Clinical Notes & Diagnosis', 40, doc.y, { font: 'Helvetica-Bold' });
    doc.moveDown(0.6);
    doc.fillColor('#102133').fontSize(10).text(notes, 40, doc.y, { width: 515, align: 'justify', lineSpacing: 3 });
    doc.moveDown(1.5);

    doc.rect(40, doc.y, 515, 1).fill('#d8e4ea');
    doc.moveDown(1.2);


    doc.fillColor('#0f766e').fontSize(13).text('Prescribed Medications List', 40, doc.y, { font: 'Helvetica-Bold' });
    doc.moveDown(0.6);

    let tableTop = doc.y;
    doc.fillColor('#0f766e').rect(40, tableTop, 515, 24).fill();
    
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Medication Name', 50, tableTop + 7);
    doc.text('Dosage', 240, tableTop + 7);
    doc.text('Route', 360, tableTop + 7);
    doc.text('Frequency', 450, tableTop + 7);
    
    currentY = tableTop + 24;
    doc.font('Helvetica'); 

    if (medicationsList && medicationsList.length > 0) {
        medicationsList.forEach((med, idx) => {
            if (idx % 2 === 0) {
                doc.fillColor('#eff5f7').rect(40, currentY, 515, 22).fill();
            }
            
            doc.fillColor('#102133').fontSize(9.5);
            const mName = med.medicineName || med.name || 'N/A';
            const mDosage = med.dosage || 'N/A';
            const mRoute = med.route || 'Oral';
            const mFreq = med.frequency || 'As Directed';

            doc.text(mName, 50, currentY + 6, { width: 180 });
            doc.text(mDosage, 240, currentY + 6, { width: 110 });
            doc.text(mRoute, 360, currentY + 6, { width: 80 });
            doc.text(mFreq, 450, currentY + 6, { width: 100 });
            
            doc.rect(40, currentY + 21, 515, 1).fill('#d8e4ea');
            currentY += 22;
        });
    } else {
        doc.fillColor('#66788a').text('No dynamic medicine courses prescribed.', 50, currentY + 7);
        currentY += 24;
    }


    doc.y = currentY + 40; 
    if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
    }

    currentY = doc.y;
    doc.rect(40, currentY, 515, 1).fill('#d8e4ea');
    doc.moveDown(1.5);

    currentY = doc.y;
    doc.fillColor('#102133').fontSize(10).font('Helvetica-Bold').text(`Dr. ${dName}`, 40, currentY);
    doc.fontSize(9).fillColor('#66788a').font('Helvetica').text(`Department of ${dDept}`, 40, currentY + 14);
    
    doc.fontSize(8.5).fillColor('#0f7db7').text('Verified Electronic Document', 40, currentY + 40, { align: 'center', font: 'Helvetica-Oblique' });
    doc.fontSize(7.5).fillColor('#66788a').text('Generated securely via 1C Healthcare Portal Engine.', 40, currentY + 52, { align: 'center', font: 'Helvetica' });

    doc.end();
};