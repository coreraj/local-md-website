import { ChangeDetectorRef, Component, inject, OnDestroy, signal } from '@angular/core';
import {
  email as emailValidator,
  FormField,
  form,
  maxLength,
  minLength,
  pattern,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { IconComponent } from '../../components/icon/icon';
import { HeroComponent } from '../../components/shared/hero/hero';
import { ServiceCardComponent } from '../../components/shared/service-card/service-card';
import { SeoService } from '../../services/seo.service';
import { ModalDialog } from '../../shared/modal-dialog';
import { RouterLink } from '@angular/router';

interface SendEmailResponse {
  success?: boolean;
  error?: string;
}

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_PATTERN = /^\+?[0-9\s\-()]+$/;

function todayIsoDate(): string {
  return new Date().toISOString().split('T')[0];
}

function createInquiryModel() {
  return {
    company: '',
    contactName: '',
    email: '',
    phone: '',
    message: '',
    website: '',
  };
}

function createMedicalAuthorizationModel() {
  return {
    employeeName: '',
    signatureDate: todayIsoDate(),
    company: '',
    accountNumber: '',
    contactPhone: '',
    contactName: '',
    authorizationExpires: '',
    contactEmail: '',
    workInjuryTreatment: false,
    consultCompensability: false,
    bodyPart: '',
    physicalPreEmployment: false,
    employeeTitle: '',
    liftTest: false,
    liftTestWeight: '',
    schoolBusDriver: false,
    schoolBusType: '',
    dotExam: false,
    dotExamType: '',
    nonDotDrugPreEmployment: false,
    nonDotDrugRandom: false,
    nonDotDrugFollowUp: false,
    nonDotDrugReasonableSuspicion: false,
    nonDotDrugReturnToDuty: false,
    nonDotDrugPostAccident: false,
    nonDotDrugHairFollicle: false,
    nonDotDrugRapid: false,
    nonDotDrugOther: '',
    nonDotAlcoholPreEmployment: false,
    nonDotAlcoholRandom: false,
    nonDotAlcoholFollowUp: false,
    nonDotAlcoholReasonableSuspicion: false,
    nonDotAlcoholReturnToDuty: false,
    nonDotAlcoholPostAccident: false,
    nonDotAlcoholOther: '',
    dotDrugPreEmployment: false,
    dotDrugRandom: false,
    dotDrugFollowUp: false,
    dotDrugReasonableSuspicion: false,
    dotDrugReturnToDuty: false,
    dotDrugPostAccident: false,
    dotDrugOther: '',
    dotAlcoholPreEmployment: false,
    dotAlcoholRandom: false,
    dotAlcoholFollowUp: false,
    dotAlcoholReasonableSuspicion: false,
    dotAlcoholReturnToDuty: false,
    dotAlcoholPostAccident: false,
    fitTesting: false,
    quantiferonGold: false,
    tbSkinTest: false,
    otherServicesOther: '',
    consent: false,
    website: '',
  };
}

@Component({
  selector: 'app-occupational-health',
  standalone: true,
  imports: [ServiceCardComponent, IconComponent, HeroComponent, FormField, ModalDialog, RouterLink],
  templateUrl: './occupational-health.html',
  styleUrl: './occupational-health.css',
})
export class OccupationalHealthComponent implements OnDestroy {
  protected readonly inquiryModel = signal(createInquiryModel());
  protected readonly inquiryForm = form(this.inquiryModel, (fields) => {
    validate(fields.company, ({ value }) => {
      const length = value().trim().length;
      if (length === 0) return { kind: 'required', message: 'Company name is required.' };
      if (length < 2)
        return { kind: 'minLength', message: 'Company name must be at least 2 characters.' };
      if (length > 100)
        return { kind: 'maxLength', message: 'Company name must be 100 characters or fewer.' };
      return undefined;
    });
    validate(fields.contactName, ({ value }) => {
      const length = value().trim().length;
      if (length === 0) return { kind: 'required', message: 'Contact name is required.' };
      if (length < 2)
        return { kind: 'minLength', message: 'Contact name must be at least 2 characters.' };
      if (length > 100)
        return { kind: 'maxLength', message: 'Contact name must be 100 characters or fewer.' };
      return undefined;
    });
    validate(fields.email, ({ value }) => {
      const email = value().trim();
      if (!email) return { kind: 'required', message: 'Email address is required.' };
      if (email.length > 100 || !EMAIL_PATTERN.test(email)) {
        return { kind: 'email', message: 'Please enter a valid email address.' };
      }
      return undefined;
    });
    validate(fields.phone, ({ value }) => {
      const phone = value().trim();
      if (!phone) return { kind: 'required', message: 'Phone number is required.' };
      if (phone.length < 7 || phone.length > 20 || !PHONE_PATTERN.test(phone)) {
        return { kind: 'phone', message: 'Please enter a valid phone number.' };
      }
      return undefined;
    });
    validate(fields.message, ({ value }) => {
      const length = value().trim().length;
      if (length === 0) return { kind: 'required', message: 'Message is required.' };
      if (length < 10)
        return { kind: 'minLength', message: 'Message must be at least 10 characters.' };
      if (length > 2000)
        return { kind: 'maxLength', message: 'Message must be 2,000 characters or fewer.' };
      return undefined;
    });
    maxLength(fields.website, 200);
  });

  protected readonly medicalAuthorizationModel = signal(createMedicalAuthorizationModel());
  protected readonly medicalAuthorizationForm = form(this.medicalAuthorizationModel, (fields) => {
    required(fields.signatureDate, { message: 'Authorization date is required.' });
    pattern(fields.signatureDate, /^\d{4}-\d{2}-\d{2}$/, {
      message: 'Enter a valid authorization date.',
    });
    validate(fields.schoolBusType, ({ value, valueOf }) =>
      valueOf(fields.schoolBusDriver) && !value()
        ? { kind: 'required', message: 'Choose Annual or New Hire for the school bus exam.' }
        : undefined,
    );
    validate(fields.dotExamType, ({ value, valueOf }) =>
      valueOf(fields.dotExam) && !value()
        ? {
            kind: 'required',
            message: 'Choose New Certification or Recertification for the DOT exam.',
          }
        : undefined,
    );
    required(fields.employeeName, { message: "Patient's Name is required." });
    minLength(fields.employeeName, 2);
    maxLength(fields.employeeName, 100);

    required(fields.company, { message: 'Employer Name is required.' });
    minLength(fields.company, 2, { message: 'Employer Name must be at least 2 characters.' });
    maxLength(fields.company, 100);
    maxLength(fields.accountNumber, 100);

    required(fields.contactPhone, { message: 'Phone is required.' });
    pattern(fields.contactPhone, PHONE_PATTERN, { message: 'Enter a valid phone number.' });
    minLength(fields.contactPhone, 7);
    maxLength(fields.contactPhone, 20);

    required(fields.contactName, { message: 'Authorized By (Print Name) is required.' });
    minLength(fields.contactName, 2);
    maxLength(fields.contactName, 100);

    required(fields.contactEmail, { message: 'Contact Email is required.' });
    emailValidator(fields.contactEmail, { message: 'Enter a valid contact email.' });
    maxLength(fields.contactEmail, 100);

    validate(fields.consent, ({ value }) =>
      value() ? undefined : { kind: 'required', message: 'Authorization consent is required.' },
    );
    maxLength(fields.website, 200);
  });

  protected isSubmitting = false;
  protected showPopup = false;
  protected popupType: 'success' | 'error' = 'success';
  protected popupMessage = '';
  protected showMedAuthModal = false;
  protected isSubmittingMedAuth = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private popupTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(SeoService).setMetadata({
      title: 'Occupational Health Services & Employee Medical Exams',
      description:
        "Keep your workforce healthy, safe, and compliant. We offer specialized occupational health services, including drug screenings, physicals, and workers' comp management.",
      image: '/assets/ocupational_health_hero.webp',
      path: '/occupational-health',
    });
  }

  protected onSubmit(): void {
    if (this.isSubmitting) return;

    void submit(this.inquiryForm, async () => {
      const values = this.inquiryModel();
      this.isSubmitting = true;
      this.cdr.markForCheck();

      try {
        const response = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company: values.company.trim(),
            contactName: values.contactName.trim(),
            email: values.email.trim(),
            phone: values.phone.trim(),
            message: values.message.trim(),
            website: values.website,
          }),
        });
        const data = await this.readResponse(response);

        if (response.ok && data?.success) {
          this.inquiryForm().reset();
          this.inquiryModel.set(createInquiryModel());
          this.triggerSuccessPopup('Email sent successfully!');
        } else {
          this.triggerErrorPopup(data?.error || 'Failed to send inquiry. Please try again.');
        }
      } catch (error: unknown) {
        console.error(
          'Inquiry request failed:',
          error instanceof Error ? error.name : 'UnknownError',
        );
        this.triggerErrorPopup('Unable to send your inquiry right now. Please try again.');
      } finally {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  protected openMedAuthModal(): void {
    this.showMedAuthModal = true;
    if (!this.medicalAuthorizationModel().signatureDate) {
      this.medicalAuthorizationModel.update((values) => ({
        ...values,
        signatureDate: todayIsoDate(),
      }));
    }
    this.cdr.markForCheck();
  }

  protected closeMedAuthModal(): void {
    this.showMedAuthModal = false;
    this.cdr.markForCheck();
  }

  protected onSubmitMedAuth(): void {
    if (this.isSubmittingMedAuth) return;

    const wasInvalid = this.medicalAuthorizationForm().invalid();
    const consentAccepted = this.medicalAuthorizationModel().consent;

    void submit(this.medicalAuthorizationForm, async () => {
      const values = this.medicalAuthorizationModel();

      const nonDotDrugs: string[] = [];
      if (values.nonDotDrugPreEmployment) nonDotDrugs.push('Pre-Employment');
      if (values.nonDotDrugRandom) nonDotDrugs.push('Random');
      if (values.nonDotDrugFollowUp) nonDotDrugs.push('Follow-Up');
      if (values.nonDotDrugReasonableSuspicion) nonDotDrugs.push('Reasonable Suspicion');
      if (values.nonDotDrugReturnToDuty) nonDotDrugs.push('Return to Duty');
      if (values.nonDotDrugPostAccident) nonDotDrugs.push('Post-Accident');
      if (values.nonDotDrugHairFollicle) nonDotDrugs.push('Hair Follicle Drug');
      if (values.nonDotDrugRapid) nonDotDrugs.push('Rapid');

      const nonDotAlcohol: string[] = [];
      if (values.nonDotAlcoholPreEmployment) nonDotAlcohol.push('Pre-Employment');
      if (values.nonDotAlcoholRandom) nonDotAlcohol.push('Random');
      if (values.nonDotAlcoholFollowUp) nonDotAlcohol.push('Follow-Up');
      if (values.nonDotAlcoholReasonableSuspicion) nonDotAlcohol.push('Reasonable Suspicion');
      if (values.nonDotAlcoholReturnToDuty) nonDotAlcohol.push('Return to Duty');
      if (values.nonDotAlcoholPostAccident) nonDotAlcohol.push('Post-Accident');

      const dotDrugs: string[] = [];
      if (values.dotDrugPreEmployment) dotDrugs.push('Pre-Employment');
      if (values.dotDrugRandom) dotDrugs.push('Random');
      if (values.dotDrugFollowUp) dotDrugs.push('Follow-Up');
      if (values.dotDrugReasonableSuspicion) dotDrugs.push('Reasonable Suspicion');
      if (values.dotDrugReturnToDuty) dotDrugs.push('Return to Duty');
      if (values.dotDrugPostAccident) dotDrugs.push('Post-Accident');

      const dotAlcohol: string[] = [];
      if (values.dotAlcoholPreEmployment) dotAlcohol.push('Pre-Employment');
      if (values.dotAlcoholRandom) dotAlcohol.push('Random');
      if (values.dotAlcoholFollowUp) dotAlcohol.push('Follow-Up');
      if (values.dotAlcoholReasonableSuspicion) dotAlcohol.push('Reasonable Suspicion');
      if (values.dotAlcoholReturnToDuty) dotAlcohol.push('Return to Duty');
      if (values.dotAlcoholPostAccident) dotAlcohol.push('Post-Accident');

      const otherServices: string[] = [];
      if (values.fitTesting) otherServices.push('Fit Testing');
      if (values.quantiferonGold) otherServices.push('Quantiferon Gold');
      if (values.tbSkinTest) otherServices.push('Tuberculosis (TB) Skin Test');

      this.isSubmittingMedAuth = true;
      this.cdr.markForCheck();

      try {
        const response = await fetch('/api/medical-authorization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeName: values.employeeName.trim(),
            signatureDate: values.signatureDate,
            company: values.company.trim(),
            accountNumber: values.accountNumber.trim(),
            contactPhone: values.contactPhone.trim(),
            contactName: values.contactName.trim(),
            authorizationExpires: values.authorizationExpires.trim(),
            contactEmail: values.contactEmail.trim(),

            workInjuryTreatment: values.workInjuryTreatment,
            consultCompensability: values.consultCompensability,
            bodyPart: values.bodyPart.trim(),

            physicalPreEmployment: values.physicalPreEmployment,
            employeeTitle: values.employeeTitle.trim(),
            liftTest: values.liftTest,
            liftTestWeight: values.liftTestWeight.trim(),
            schoolBusDriver: values.schoolBusDriver,
            schoolBusType: values.schoolBusType,
            dotExam: values.dotExam,
            dotExamType: values.dotExamType,

            nonDotDrugs,
            nonDotDrugOther: values.nonDotDrugOther.trim(),
            nonDotAlcohol,
            nonDotAlcoholOther: values.nonDotAlcoholOther.trim(),
            dotDrugs,
            dotDrugOther: values.dotDrugOther.trim(),
            dotAlcohol,

            otherServices,
            otherServicesOther: values.otherServicesOther.trim(),

            signatureName: values.contactName.trim(),
            consent: values.consent,
            website: values.website,
          }),
        });
        const data = await this.readResponse(response);

        if (response.ok && data?.success) {
          this.closeMedAuthModal();
          this.resetMedAuthForm();
          this.triggerSuccessPopup(
            'Medical Authorization Form submitted to Local MD Occupational Health!',
          );
        } else {
          this.triggerErrorPopup(data?.error || 'Failed to submit Medical Authorization Form');
        }
      } catch (error: unknown) {
        console.error(
          'Medical authorization request failed:',
          error instanceof Error ? error.name : 'UnknownError',
        );
        this.triggerErrorPopup('Unable to submit the form right now. Please try again.');
      } finally {
        this.isSubmittingMedAuth = false;
        this.cdr.markForCheck();
      }
    });

    if (wasInvalid) {
      this.triggerErrorPopup(
        consentAccepted
          ? 'Please correct the highlighted required fields.'
          : 'Please accept the electronic signature authorization consent.',
      );
    }
  }

  private resetMedAuthForm(): void {
    this.medicalAuthorizationForm().reset();
    this.medicalAuthorizationModel.set(createMedicalAuthorizationModel());
  }

  private async readResponse(response: Response): Promise<SendEmailResponse | null> {
    try {
      return (await response.json()) as SendEmailResponse;
    } catch {
      return null;
    }
  }

  private triggerSuccessPopup(message: string): void {
    this.popupType = 'success';
    this.popupMessage = message;
    this.showPopup = true;
    this.cdr.markForCheck();
    this.scheduleAutoDismissPopup(6000);
  }

  private triggerErrorPopup(message = 'Something went wrong'): void {
    this.popupType = 'error';
    this.popupMessage = message;
    this.showPopup = true;
    this.cdr.markForCheck();
    this.scheduleAutoDismissPopup(6000);
  }

  protected closePopup(): void {
    this.showPopup = false;
    this.cdr.markForCheck();
    if (this.popupTimeoutId) {
      clearTimeout(this.popupTimeoutId);
      this.popupTimeoutId = null;
    }
  }

  private scheduleAutoDismissPopup(delayMs: number): void {
    if (this.popupTimeoutId) {
      clearTimeout(this.popupTimeoutId);
    }
    this.popupTimeoutId = setTimeout(() => {
      this.showPopup = false;
      this.cdr.markForCheck();
    }, delayMs);
  }

  ngOnDestroy(): void {
    if (this.popupTimeoutId) clearTimeout(this.popupTimeoutId);
  }
}
