import type {
  MedicalRecord,
  MedicalRecordPatient,
  MedicalRecordPayload,
  PaginatedResponse,
} from "../types/medicalRecord";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;


function getAuthHeaders() {
  const token =
    localStorage.getItem(
      "access_token",
    );

  return {
    "Content-Type":
      "application/json",

    Authorization:
      `Bearer ${token}`,
  };
}


async function getErrorMessage(
  response: Response,
): Promise<string> {
  const data = await response
    .json()
    .catch(() => null);

  if (
    data &&
    typeof data === "object"
  ) {
    const objectData =
      data as Record<
        string,
        unknown
      >;

    if (
      typeof objectData.detail ===
      "string"
    ) {
      return objectData.detail;
    }

    const fieldMessages =
      Object.entries(
        objectData,
      ).flatMap(
        ([field, value]) => {
          if (Array.isArray(value)) {
            return value.map(
              (message) =>
                `${field}: ${String(
                  message,
                )}`,
            );
          }

          if (
            typeof value ===
            "string"
          ) {
            return [
              `${field}: ${value}`,
            ];
          }

          return [];
        },
      );

    if (
      fieldMessages.length >
      0
    ) {
      return fieldMessages.join(
        " ",
      );
    }
  }

  return (
    `Error del servidor (${response.status}).`
  );
}


function readList<T>(
  data:
    | T[]
    | PaginatedResponse<T>,
): T[] {
  return Array.isArray(data)
    ? data
    : data.results ?? [];
}


export async function getMedicalRecordPatients(): Promise<
  MedicalRecordPatient[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/patients/?show_inactive=true`,
    {
      headers:
        getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  const data:
    | MedicalRecordPatient[]
    | PaginatedResponse<MedicalRecordPatient> =
    await response.json();

  return readList(data);
}


export async function getMedicalRecords(): Promise<
  MedicalRecord[]
> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/?show_inactive=true`,
    {
      headers:
        getAuthHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  const data:
    | MedicalRecord[]
    | PaginatedResponse<MedicalRecord> =
    await response.json();

  return readList(data);
}


export async function createMedicalRecord(
  payload:
    MedicalRecordPayload,
): Promise<MedicalRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/`,
    {
      method: "POST",

      headers:
        getAuthHeaders(),

      body: JSON.stringify(
        payload,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}


export async function updateMedicalRecord(
  id: number,
  payload:
    MedicalRecordPayload,
): Promise<MedicalRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/${id}/`,
    {
      method: "PATCH",

      headers:
        getAuthHeaders(),

      body: JSON.stringify(
        payload,
      ),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}


export async function reactivateMedicalRecord(
  id: number,
): Promise<MedicalRecord> {
  const response = await fetch(
    `${API_BASE_URL}/api/medical-records/${id}/reactivate/`,
    {
      method: "PATCH",

      headers:
        getAuthHeaders(),

      body: JSON.stringify({}),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
      ),
    );
  }

  return response.json();
}
