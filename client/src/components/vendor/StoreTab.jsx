import { useState } from "react";
import api from "../../api/axios";
import { notify } from "../Toast";
import { uploadImage } from "./shared.js";

export function StoreTab({
  profile,
  setProfile,
  onChanged,
}) {
  const [uploading, setUploading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const uploadStoreImage =
    async (event, field) => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      try {
        setUploading(true);

        const url =
          await uploadImage(file);

        setProfile(
          (current) => ({
            ...current,
            [field]: url,
          })
        );

        notify(
          `${
            field === "logo"
              ? "Logo"
              : "Banner"
          } uploaded`
        );
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            "Upload failed",
          "error"
        );
      } finally {
        setUploading(false);
      }
    };

  const saveProfile =
    async (event) => {
      event.preventDefault();

      setSaving(true);

      try {
        await api.put(
          "/vendors/me",
          {
            storeName:
              profile.storeName,

            description:
              profile.description,

            logo:
              profile.logo,

            bannerImage:
              profile.bannerImage,
          }
        );

        notify(
          "Store profile updated"
        );

        await onChanged();
      } catch (error) {
        notify(
          error.response?.data
            ?.message ||
            "Store update failed",
          "error"
        );
      } finally {
        setSaving(false);
      }
    };

  return (
    <>
      <div className="page-title">
        <h1>Store settings</h1>
      </div>

      <form
        className="panel"
        onSubmit={saveProfile}
      >
        <label>
          Store name

          <input
            value={
              profile.storeName
            }
            onChange={(event) =>
              setProfile({
                ...profile,
                storeName:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <label>
          Description

          <textarea
            value={
              profile.description ||
              ""
            }
            onChange={(event) =>
              setProfile({
                ...profile,
                description:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <label>
          Logo URL

          <input
            value={
              profile.logo || ""
            }
            onChange={(event) =>
              setProfile({
                ...profile,
                logo:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <label>
          Upload logo

          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              uploadStoreImage(
                event,
                "logo"
              )
            }
          />
        </label>

        {profile.logo && (
          <img
            className="settings-image-preview"
            src={profile.logo}
            alt="Store logo"
          />
        )}

        <label>
          Banner URL

          <input
            value={
              profile.bannerImage ||
              ""
            }
            onChange={(event) =>
              setProfile({
                ...profile,
                bannerImage:
                  event.target
                    .value,
              })
            }
          />
        </label>

        <label>
          Upload banner

          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              uploadStoreImage(
                event,
                "bannerImage"
              )
            }
          />
        </label>

        {profile.bannerImage && (
          <img
            className="settings-banner-preview"
            src={
              profile.bannerImage
            }
            alt="Store banner"
          />
        )}

        <button
          className="button"
          disabled={
            uploading || saving
          }
        >
          {saving
            ? "Saving..."
            : "Save store settings"}
        </button>
      </form>
    </>
  );
}
